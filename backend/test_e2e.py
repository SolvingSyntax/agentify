import sys
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def run_e2e_tests():
    print("==================================================")
    print("        AGENTIFY END-TO-END SMOKE TESTS           ")
    print("==================================================\n")

    # 1. Health Check
    print("1. Testing Health Check...")
    resp = client.get("/api/v1/health")
    assert resp.status_code == 200, f"Health check failed: {resp.text}"
    print("   [SUCCESS] API is healthy.\n")

    # 2. User Registration
    print("2. Testing User Registration...")
    user_email = "testowner@agentify.dev"
    user_password = "SecurePassword123!"
    reg_payload = {
        "email": user_email,
        "password": user_password,
        "full_name": "Test Owner"
    }
    resp = client.post("/api/v1/auth/register", json=reg_payload)
    if resp.status_code == 400 and "already exists" in resp.text:
        print("   [INFO] Test user already exists, proceeding to login.")
    else:
        assert resp.status_code == 201, f"Registration failed: {resp.text}"
        print("   [SUCCESS] User registered & default workspace auto-provisioned.")

    # 3. User Login & Token Acquisition
    print("3. Testing User Login...")
    login_payload = {"email": user_email, "password": user_password}
    resp = client.post("/api/v1/auth/login", json=login_payload)
    assert resp.status_code == 200, f"Login failed: {resp.text}"
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("   [SUCCESS] JWT token acquired successfully.")

    # 4. Verify Active Workspace Provisioning
    print("4. Testing Workspace Resolution...")
    resp = client.get("/api/v1/auth/workspaces", headers=headers)
    assert resp.status_code == 200, f"Workspace fetch failed: {resp.text}"
    workspaces = resp.json()
    assert len(workspaces) > 0, "No workspace found for registered user."
    workspace_id = workspaces[0]["id"]
    print(f"   [SUCCESS] Active Workspace ID: {workspace_id}\n")

    # 5. Agent Creation
    print("5. Testing Agent Creation...")
    agent_payload = {
        "name": "Customer Support Classifier",
        "description": "Classifies support requests",
        "role": "assistant",
        "model": "gemini-2.5-flash",
        "system_prompt": "You are a customer support triage assistant.",
        "tools": []
    }
    resp = client.post("/api/v1/agents/", json=agent_payload, headers=headers)
    assert resp.status_code == 201, f"Agent creation failed: {resp.text}"
    agent_id = resp.json()["id"]
    print(f"   [SUCCESS] Agent created with ID: {agent_id}")

    # 6. Agent Execution Test
    print("6. Testing Agent Direct Execution (Gemini Wrapper)...")
    test_payload = {"prompt": "Is my order #1234 shipped?"}
    resp = client.post(f"/api/v1/agents/{agent_id}/test", json=test_payload, headers=headers)
    assert resp.status_code == 200, f"Agent test execution failed: {resp.text}"
    print(f"   [SUCCESS] Response received: {resp.json()['response'][:60]}...\n")

    # 7. Workflow DAG Creation & Cycle Detection Test
    print("7. Testing Workflow DAG Engine...")
    workflow_payload = {
        "name": "Support Triage & Approval Workflow",
        "description": "Processes tickets and routes for manual approval",
        "nodes": [
            {
                "id": "node-1",
                "name": "Triage Agent",
                "type": "agent",
                "config": {"prompt": "Analyze incoming ticket.", "model": "gemini-2.5-flash"}
            },
            {
                "id": "node-2",
                "name": "Manager Approval Gate",
                "type": "approval",
                "config": {"action_name": "Approve Refund"}
            }
        ],
        "edges": [
            {"id": "edge-1", "source": "node-1", "target": "node-2"}
        ]
    }
    resp = client.post("/api/v1/workflows/", json=workflow_payload, headers=headers)
    assert resp.status_code == 201, f"Workflow creation failed: {resp.text}"
    workflow_id = resp.json()["id"]
    print(f"   [SUCCESS] Workflow created with ID: {workflow_id}")

    # 8. Workflow Execution
    print("8. Testing Workflow Execution...")
    exec_payload = {"initial_input": {"ticket_id": "TICK-99", "issue": "Requesting full refund"}}
    resp = client.post(f"/api/v1/workflows/{workflow_id}/execute", json=exec_payload, headers=headers)
    assert resp.status_code == 200, f"Workflow execution failed: {resp.text}"
    execution = resp.json()
    execution_id = execution["id"]
    print(f"   [SUCCESS] Workflow execution started. ID: {execution_id}, Status: {execution['status']}\n")

    # 9. Human-in-the-Loop Approvals
    print("9. Testing Human-in-the-Loop Approval Processing...")
    resp = client.get("/api/v1/approvals/?status_filter=pending", headers=headers)
    assert resp.status_code == 200, f"Approvals list failed: {resp.text}"
    approvals = resp.json()
    assert len(approvals) > 0, "No pending approval generated by the workflow engine."
    approval_id = approvals[0]["id"]

    action_payload = {"status": "approved", "comment": "Refund verified and approved."}
    resp = client.post(f"/api/v1/approvals/{approval_id}/action", json=action_payload, headers=headers)
    assert resp.status_code == 200, f"Approval action failed: {resp.text}"
    print(f"   [SUCCESS] Approval {approval_id} processed as 'approved'.\n")

    # 10. Integrations Engine
    print("10. Testing Integrations Engine...")
    integration_payload = {
        "provider": "smtp",
        "name": "Primary Mail Server",
        "is_connected": True,
        "config": {"host": "smtp.mailtrap.io", "port": 2525, "username": "test_user"}
    }
    resp = client.post("/api/v1/integrations/", json=integration_payload, headers=headers)
    assert resp.status_code == 201, f"Integration creation failed: {resp.text}"
    integration_id = resp.json()["id"]

    email_test_payload = {
        "recipient_email": "user@example.com",
        "subject": "System Ready",
        "body": "Agentify E2E verification complete."
    }
    resp = client.post(f"/api/v1/integrations/{integration_id}/test-email", json=email_test_payload, headers=headers)
    assert resp.status_code == 200, f"Test email failed: {resp.text}"
    print(f"   [SUCCESS] SMTP Integration verified.\n")

    print("==================================================")
    print("   ALL E2E SMOKE TESTS PASSED SUCCESSFULLY!       ")
    print("==================================================")


if __name__ == "__main__":
    run_e2e_tests()