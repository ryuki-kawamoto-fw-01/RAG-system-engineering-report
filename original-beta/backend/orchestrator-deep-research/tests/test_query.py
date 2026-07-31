from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_process_query():
    query_data = {
        "query": "test query"
    }
    response = client.post("/query/", json=query_data)
    assert response.status_code == 200
    data = response.json()
    assert "final_output" in data
    assert isinstance(data["final_output"], str)
    assert len(data["final_output"]) > 0

def test_process_query_invalid_input():
    # Test missing query field
    response = client.post("/query/", json={})
    assert response.status_code == 422

    # Test wrong type for query
    response = client.post("/query/", json={"query": 123})
    assert response.status_code == 422

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

