def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert data["health"] == "/api/v1/health"


def test_health_endpoint(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "geophysics-sandbox-backend"
    assert "timestamp" in data
    assert "versions" in data

    versions = data["versions"]
    assert "python" in versions
    assert "fastapi" in versions
    assert "numpy" in versions
    assert "scipy" in versions
    assert "matplotlib" in versions
