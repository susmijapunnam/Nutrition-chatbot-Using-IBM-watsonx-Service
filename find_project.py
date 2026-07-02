"""
find_project.py — Lists all IBM Watsonx projects for your API key
Run: python find_project.py
"""
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

from dotenv import load_dotenv
load_dotenv()
import os, requests

API_KEY = os.getenv("IBM_API_KEY", "")

# Try all IBM Cloud regional endpoints
REGIONS = [
    ("us-south  (Dallas)",  "https://us-south.ml.cloud.ibm.com"),
    ("eu-de     (Frankfurt)","https://eu-de.ml.cloud.ibm.com"),
    ("eu-gb     (London)",  "https://eu-gb.ml.cloud.ibm.com"),
    ("au-syd    (Sydney)",  "https://au-syd.ml.cloud.ibm.com"),
    ("jp-tok    (Tokyo)",   "https://jp-tok.ml.cloud.ibm.com"),
    ("ca-tor    (Toronto)", "https://ca-tor.ml.cloud.ibm.com"),
]

print("Getting IAM token...")
token_res = requests.post(
    "https://iam.cloud.ibm.com/identity/token",
    data={"grant_type": "urn:ibm:params:oauth:grant-type:apikey", "apikey": API_KEY},
    headers={"Content-Type": "application/x-www-form-urlencoded"}
)
if token_res.status_code != 200:
    print("FAILED to get token:", token_res.text[:200])
    exit(1)

token = token_res.json().get("access_token", "")
print("IAM token OK\n")

# List all projects (global, not region-specific)
print("Fetching all Watsonx projects...")
proj_res = requests.get(
    "https://api.dataplatform.cloud.ibm.com/v2/projects?limit=20",
    headers={"Authorization": f"Bearer {token}"}
)
projects = proj_res.json().get("resources", [])
print(f"Found {len(projects)} project(s):\n")
for p in projects:
    name = p["entity"]["name"]
    guid = p["metadata"]["guid"]
    print(f"  Name : {name}")
    print(f"  ID   : {guid}")
    print()

# Now test which WML region is active
print("\nTesting WML regions for active instance...\n")
from ibm_watsonx_ai import Credentials
from ibm_watsonx_ai.foundation_models import ModelInference
from ibm_watsonx_ai.metanames import GenTextParamsMetaNames as Params

for region_name, region_url in REGIONS:
    print(f"  [{region_name}]  ", end="", flush=True)
    try:
        creds = Credentials(url=region_url, api_key=API_KEY)
        # Use the first available project for testing
        if projects:
            test_pid = projects[0]["metadata"]["guid"]
            model = ModelInference(
                model_id    = "ibm/granite-3-1-8b-base",
                credentials = creds,
                project_id  = test_pid,
                params      = {Params.MAX_NEW_TOKENS: 10},
            )
            result = model.generate_text(prompt="Hello")
            print(f"ACTIVE! --> {region_url}")
            print(f"\n  USE THIS URL: {region_url}")
            break
        else:
            print("No projects to test with")
    except Exception as e:
        err = str(e)
        if "Inactive" in err:
            print(f"WML Inactive at this region")
        elif "not supported" in err or "model_spec" in err.lower():
            print(f"No model support here")
        elif "not_found" in err or "404" in err:
            print(f"Not found")
        else:
            print(f"Error: {err[:70]}")
