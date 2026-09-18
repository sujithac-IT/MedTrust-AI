import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from backend.app.main import app

def run_smoke():
    client = TestClient(app)

    # 1. Health check
    res = client.get('/health')
    assert res.status_code == 200, f'Health failed: {res.text}'
    print('1. Health check passed:', res.json())

    # 2. Patients API
    res = client.get('/api/patients')
    assert res.status_code == 200, f'Patients failed: {res.text}'
    patients = res.json()
    print('2. Patients API passed, count:', len(patients))

    # 3. Consultations API
    res = client.get('/api/consultations')
    assert res.status_code == 200, f'Consultations failed: {res.text}'
    consultations = res.json()
    print('3. Consultations API passed, count:', len(consultations))

    # 4. Generate Case Sheet API
    cid = consultations[0]["id"]
    res = client.post(f'/api/consultations/{cid}/generate-casesheet')
    assert res.status_code == 200, f'Case sheet generation failed: {res.text}'
    cs_data = res.json()
    print('4. Case sheet generation passed, diagnosis:', cs_data.get('case_sheet', {}).get('provisional_diagnosis'))

    # 5. Multilingual Summary & Consultation Details
    res = client.get(f'/api/consultations/{cid}')
    assert res.status_code == 200, f'Consultation detail failed: {res.text}'
    c_data = res.json()
    print('5. Multilingual summary passed, langs:', list(c_data.get('multilingual_summary', {}).keys()))

    # 6. Print HTML view
    res = client.get(f'/api/consultations/{cid}/print')
    assert res.status_code == 200, f'Print view failed: {res.text}'
    assert 'Clinical Case Sheet' in res.text
    print('6. Print HTML view passed, length:', len(res.text))

    # 7. Static HTML serving
    res = client.get('/')
    assert res.status_code == 200, f'Root failed: {res.status_code}'
    assert 'MedTrust' in res.text, 'Brand not in HTML'
    print('7. Root HTML serving passed, length:', len(res.text))

    print('\nALL SMOKE TESTS PASSED PERFECTLY!')

if __name__ == '__main__':
    run_smoke()
