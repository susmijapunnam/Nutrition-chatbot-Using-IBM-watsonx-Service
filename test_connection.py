"""
test_connection.py — Tests IBM Watsonx.ai connection end-to-end.
Run: python test_connection.py
"""
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

from dotenv import load_dotenv
load_dotenv()
import os, requests

API_KEY    = os.getenv("IBM_API_KEY", "")
WX_URL     = os.getenv("IBM_WATSONX_URL", "")
PROJECT_ID = os.getenv("IBM_PROJECT_ID", "")
MODEL_ID   = os.getenv("WATSONX_MODEL_ID", "")

print("=" * 55)
print("  NutriBot - IBM Watsonx.ai Connection Test")
print("=" * 55)
print(f"  API Key    : {API_KEY[:18]}...")
print(f"  Project ID : {PROJECT_ID}")
print(f"  Model      : {MODEL_ID}")
print(f"  URL        : {WX_URL}")
print("=" * 55)

# Step 1: IAM Token
print("\n[1/4] Getting IAM token...")
token_res = requests.post(
    "https://iam.cloud.ibm.com/identity/token",
    data={
        "grant_type": "urn:ibm:params:oauth:grant-type:apikey",
        "apikey": API_KEY
    },
    headers={"Content-Type": "application/x-www-form-urlencoded"}
)
if token_res.status_code != 200:
    print(f"  FAILED ({token_res.status_code}): {token_res.text[:300]}")
    exit(1)
token = token_res.json().get("access_token", "")
print("  PASS - IAM token obtained")

# Step 2: Try all regions to find active Runtime
print("\n[2/4] Scanning all regions for active watsonx.ai Runtime...")
REGIONS = [
    ("au-syd (Sydney)",    "https://au-syd.ml.cloud.ibm.com"),
    ("ca-tor (Toronto)",   "https://ca-tor.ml.cloud.ibm.com"),
    ("us-south (Dallas)",  "https://us-south.ml.cloud.ibm.com"),
    ("eu-de (Frankfurt)",  "https://eu-de.ml.cloud.ibm.com"),
    ("eu-gb (London)",     "https://eu-gb.ml.cloud.ibm.com"),
    ("jp-tok (Tokyo)",     "https://jp-tok.ml.cloud.ibm.com"),
]

WORKING_URL = None
WORKING_MODEL = None

from ibm_watsonx_ai import Credentials
from ibm_watsonx_ai.foundation_models import ModelInference
from ibm_watsonx_ai.metanames import GenTextParamsMetaNames as Params

# Models to try in order
MODELS_TO_TRY = [
    "ibm/granite-3-1-8b-base",
    "meta-llama/llama-3-3-70b-instruct",
    "meta-llama/llama-3-1-8b",
    "mistralai/mistral-small-3-1-24b-instruct-2503",
]

for region_name, region_url in REGIONS:
    print(f"\n  Testing {region_name}...")
    for model_id in MODELS_TO_TRY:
        try:
            creds = Credentials(url=region_url, api_key=API_KEY)
            model = ModelInference(
                model_id    = model_id,
                credentials = creds,
                project_id  = PROJECT_ID,
                params      = {Params.MAX_NEW_TOKENS: 30, Params.TEMPERATURE: 0.5},
            )
            result = model.generate_text(
                prompt="### System\nYou are a nutrition assistant.\n### User\nSay hello in 5 words.\n### Assistant\n"
            )
            print(f"    ACTIVE! Model: {model_id}")
            print(f"    Response: {result.strip()[:80]}")
            WORKING_URL   = region_url
            WORKING_MODEL = model_id
            break
        except Exception as e:
            err = str(e)
            if "Inactive" in err:
                print(f"    {model_id[:30]} -> WML Inactive")
            elif "not supported" in err or "Unable to get model" in err:
                print(f"    {model_id[:30]} -> not available here")
            elif "not associated" in err:
                print(f"    Project not associated with runtime here")
                break
            elif "Unauthorized" in err or "401" in err:
                print(f"    Unauthorized at this region")
                break
            else:
                print(f"    {model_id[:30]} -> {err[:60]}")
    if WORKING_URL:
        break

print()
if WORKING_URL:
    print("=" * 55)
    print("  WORKING CONFIGURATION FOUND!")
    print(f"  URL   : {WORKING_URL}")
    print(f"  Model : {WORKING_MODEL}")
    print("=" * 55)
    # Auto-update .env
    env_content = f"""# ============================================================
#  IBM Watsonx.ai -- Nutrition Agent Configuration
# ============================================================

IBM_API_KEY={API_KEY}
IBM_WATSONX_URL={WORKING_URL}
IBM_PROJECT_ID={PROJECT_ID}
WATSONX_MODEL_ID={WORKING_MODEL}
FLASK_SECRET_KEY=nutribot-secret-2025-xK9mP
FLASK_ENV=development
FLASK_DEBUG=True
FLASK_PORT=5000
"""
    with open(".env", "w") as f:
        f.write(env_content)
    print("\n  .env auto-updated! Now run: python app.py")
else:
    print("  No active region found.")
    print("  --> Please associate watsonx.ai Runtime to your project.")
    print("  --> Click 'watsonx.ai Runtime-gl' in your IBM Cloud resource list")
    print("      then go to your project -> Manage -> Services -> Associate service")
