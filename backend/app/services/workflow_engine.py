from collections import defaultdict, deque
from datetime import datetime, timezone
from typing import Dict, List, Any, Tuple
from sqlalchemy.orm import Session

from app.models.workflow import Workflow, Execution, ExecutionStep
from app.models.approval import Approval
from app.services.gemini_service import gemini_service


class WorkflowValidationError(Exception):
    pass


class WorkflowEngine:
    @staticmethod
    def validate_dag(nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]]) -> List[str]:
        """
        Validates that the workflow is a Directed Acyclic Graph (DAG) using Kahn's algorithm.
        Returns a topologically sorted list of node IDs if valid.
        Raises WorkflowValidationError if a cycle is detected.
        """
        node_ids = {node["id"] for node in nodes}
        in_degree = {node_id: 0 for node_id in node_ids}
        adj_list = defaultdict(list)

        for edge in edges:
            src, tgt = edge["source"], edge["target"]
            if src not in node_ids or tgt not in node_ids:
                raise WorkflowValidationError(f"Invalid edge reference: {src} -> {tgt}")
            adj_list[src].append(tgt)
            in_degree[tgt] += 1

        queue = deque([node_id for node_id in node_ids if in_degree[node_id] == 0])
        topological_order = []

        while queue:
            curr = queue.popleft()
            topological_order.append(curr)

            for neighbor in adj_list[curr]:
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    queue.append(neighbor)

        if len(topological_order) != len(node_ids):
            raise WorkflowValidationError("Cycle detected in workflow graph. Workflows must be a DAG.")

        return topological_order

    def execute_workflow(
        self,
        db: Session,
        workflow: Workflow,
        initial_input: Dict[str, Any]
    ) -> Execution:
        """Executes a workflow graph step-by-step."""
        # 1. Validate DAG and get execution order
        execution_order = self.validate_dag(workflow.nodes, workflow.edges)
        nodes_by_id = {node["id"]: node for node in workflow.nodes}

        # 2. Create Execution record
        execution = Execution(
            workflow_id=workflow.id,
            workspace_id=workflow.workspace_id,
            status="running"
        )
        db.add(execution)
        db.commit()
        db.refresh(execution)

        context = dict(initial_input)

        try:
            for node_id in execution_order:
                node = nodes_by_id[node_id]
                node_type = node.get("type", "prompt")
                node_config = node.get("config", {})

                # Create step record
                step = ExecutionStep(
                    execution_id=execution.id,
                    node_id=node["id"],
                    node_name=node.get("name", node["id"]),
                    node_type=node_type,
                    status="running",
                    input_data=dict(context)
                )
                db.add(step)
                db.commit()

                # Process Node
                output_data = {}
                if node_type == "agent":
                    prompt = node_config.get("prompt", str(context))
                    system_prompt = node_config.get("system_prompt", "You are an automated assistant.")
                    model = node_config.get("model", "gemini-2.5-flash")

                    ai_response = gemini_service.generate(
                        prompt=prompt,
                        system_prompt=system_prompt,
                        model=model
                    )
                    output_data = {"result": ai_response}

                elif node_type == "approval":
                    # Human-in-the-loop approval gate
                    step.status = "awaiting_approval"
                    db.commit()

                    approval = Approval(
                        workspace_id=workflow.workspace_id,
                        execution_id=execution.id,
                        step_id=step.id,
                        action_name=node_config.get("action_name", f"Approve step {node['id']}"),
                        payload=context,
                        status="pending"
                    )
                    db.add(approval)

                    execution.status = "awaiting_approval"
                    db.commit()
                    return execution

                else:  # Default prompt or passthrough node
                    output_data = {"result": f"Executed step '{node.get('name')}' with input context."}

                # Save step output
                step.status = "completed"
                step.output_data = output_data
                step.completed_at = datetime.now(timezone.utc)
                db.commit()

                # Pass node output to downstream context
                context[node["id"]] = output_data

            execution.status = "completed"
            execution.completed_at = datetime.now(timezone.utc)
            db.commit()

        except Exception as e:
            execution.status = "failed"
            execution.error_message = str(e)
            execution.completed_at = datetime.now(timezone.utc)
            db.commit()

        return execution


workflow_engine = WorkflowEngine()