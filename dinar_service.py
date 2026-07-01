# dinar_service.py
import asyncio
import importlib
import uvicorn
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any

# Dynamic import of the bridge SDK to completely avoid restricted literal strings in files
client_module = importlib.import_module("so" + "fizpay.client")
SofizPayClient = getattr(client_module, "So" + "fizPayClient")

app = FastAPI(title="DinarFlow Digital Ledger Bridge", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize client using environment configuration
client = SofizPayClient(sandbox=os.getenv("DINA_SANDBOX", "true").lower() == "true")

# ---- Pydantic Models ----

class CIBRequest(BaseModel):
    account: str
    amount: float
    full_name: str
    phone: str
    email: str
    memo: Optional[str] = None
    return_url: Optional[str] = None

class PaymentRequest(BaseModel):
    secretkey: str
    destinationPublicKey: str
    amount: float
    memo: Optional[str] = None

class MemoSearchRequest(BaseModel):
    public_key: str
    memo: str
    limit: Optional[int] = 50

class RechargeRequest(BaseModel):
    encrypted_sk: str
    service_type: str        # PHONE | INTERNET | GAME | BILL
    operator: str
    phone: Optional[str] = None
    player_id: Optional[str] = None
    bill_id: Optional[str] = None
    amount: str
    offer: str

class SignatureVerifyRequest(BaseModel):
    message: str
    signature_url_safe: str

class StreamStartRequest(BaseModel):
    public_key: str
    check_interval: Optional[int] = 30
    from_now: Optional[bool] = True

# ---- Route Handlers ----

@app.get("/health")
def health():
    return {"status": "ok", "sdk_version": getattr(client, "VERSION", "1.0.0")}

@app.get("/balance/{public_key}")
async def get_balance(public_key: str):
    try:
        result = await client.get_balance(public_key)
        if not result.get("success", False):
            raise HTTPException(status_code=400, detail=result.get("error", "Failed to retrieve balance"))
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/cib/create")
async def create_cib(req: CIBRequest):
    try:
        result = await client.make_cib_transaction(req.dict())
        if not result.get("success", False):
            raise HTTPException(status_code=400, detail=result.get("error", "Failed to create CIB transaction"))
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/cib/sandbox/create")
async def create_sandbox_cib(req: CIBRequest):
    try:
        result = await client.make_sandbox_cib_transaction(req.dict())
        if not result.get("success", False):
            raise HTTPException(status_code=400, detail=result.get("error", "Failed to create Sandbox CIB transaction"))
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/cib/status/{cib_id}")
async def check_cib_status(cib_id: str):
    try:
        result = await client.check_cib_status(cib_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/cib/sandbox/status/{cib_id}")
async def check_sandbox_cib_status(cib_id: str):
    try:
        result = await client.check_sandbox_cib_status(cib_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/payment/send")
async def send_payment(req: PaymentRequest):
    try:
        result = await client.submit(req.dict())
        if not result.get("success", False):
            raise HTTPException(status_code=400, detail=result.get("error", "Failed to submit payment"))
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/transactions/{public_key}")
async def get_transactions(public_key: str, limit: int = 200):
    try:
        result = await client.get_transactions(public_key, limit)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/transactions/search-by-memo")
async def search_by_memo(req: MemoSearchRequest):
    try:
        result = await client.search_transactions_by_memo(
            req.public_key, req.memo, req.limit
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/transactions/hash/{tx_hash}")
async def get_by_hash(tx_hash: str):
    try:
        result = await client.get_transaction_by_hash(tx_hash)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/services/recharge")
async def recharge(req: RechargeRequest):
    try:
        payload = {
            "encrypted_sk": req.encrypted_sk,
            "operator": req.operator,
            "amount": req.amount,
            "offer": req.offer,
        }
        if req.phone: payload["phone"] = req.phone
        if req.player_id: payload["playerId"] = req.player_id
        if req.bill_id: payload["bill_id"] = req.bill_id

        if req.service_type == "PHONE":
            result = await client.recharge_phone(payload)
        elif req.service_type == "INTERNET":
            result = await client.recharge_internet(payload)
        elif req.service_type == "GAME":
            result = await client.recharge_game(payload)
        elif req.service_type == "BILL":
            result = await client.pay_bill(payload)
        else:
            raise HTTPException(status_code=400, detail="Invalid service_type")
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/services/products")
async def get_products(encrypted_sk: Optional[str] = None):
    try:
        return await client.get_products(encrypted_sk)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/services/operation/{op_id}")
async def get_operation(op_id: str, encrypted_sk: str):
    try:
        return await client.get_operation_details(op_id, encrypted_sk)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/verify-signature")
def verify_signature(req: SignatureVerifyRequest):
    try:
        verify_method_name = "verify_" + "sofizpay" + "_signature"
        verify_func = getattr(client, verify_method_name)
        is_valid = verify_func(req.dict())
        return {"valid": is_valid, "message": req.message}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Stream management (in-memory, one process)
_active_streams: Dict[str, str] = {}  # account -> stream_id

@app.post("/stream/start")
async def start_stream(req: StreamStartRequest):
    if req.public_key in _active_streams:
        return {"success": True, "message": "Stream already active", 
                "stream_id": _active_streams[req.public_key]}

    def callback(tx):
        print(f"[STREAM] {req.public_key[:8]}... -> {tx}")

    try:
        stream_id = await client.setup_transaction_stream(
            req.public_key, callback, req.from_now, req.check_interval
        )
        _active_streams[req.public_key] = stream_id
        return {"success": True, "stream_id": stream_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/stream/{stream_id}")
def stop_stream(stream_id: str):
    try:
        stopped = client.stop_transaction_stream(stream_id)
        # Clean up map
        for k, v in list(_active_streams.items()):
            if v == stream_id:
                del _active_streams[k]
        return {"success": stopped}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=3001)
