import os
import random
from datetime import datetime, timedelta
import pandas as pd

def generate_murugan_tiffin_csv() -> str:
    """
    Murugan Tiffin Cart: 90 days of daily street food & tiffin stall transactions.
    - Average daily digital receipts: ~₹4,000 (from ₹30 to ₹180 per customer via UPI QR).
    - Requested loan: ₹50,000 for equipment & working capital.
    - Morning vegetable/dairy restock debits (₹1,500 - ₹2,400).
    - Commercial LPG refills and municipal stall fees.
    - Occasional personal transfer to family (₹1,500) - flagged and excluded.
    - Zero formal salary slip, zero traditional bureau history, no collateral.
    """
    random.seed(505)
    records = []
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=90)
    current_date = start_date
    txn_counter = 4001

    tiffin_items = ["Idli Sambar", "Crispy Dosa", "Medu Vada", "Filter Coffee", "Pongal Special", "Poori Masala", "Evening Bajji"]

    while current_date <= end_date:
        day_str = current_date.strftime("%Y-%m-%d")
        is_weekend = current_date.weekday() in [5, 6]  # Sat, Sun

        # 1. Morning Wholesale Provision / Mandi Vegetables (Daily)
        mandi_amt = round(random.uniform(1600, 2400) if not is_weekend else random.uniform(2200, 3200), 2)
        records.append({
            "txn_id": f"TXN-MURUGAN-{txn_counter}",
            "txn_date": f"{day_str} 06:15:00",
            "amount": mandi_amt,
            "direction": "debit",
            "description": "Daily Koyambedu Mandi Fresh Vegetables & Rice Batter Restock",
            "channel": "UPI",
            "reference_id": f"MANDI/{random.randint(10000, 99999)}"
        })
        txn_counter += 1

        # 2. Milk & Dairy Supply (Amul / Aavin Distributor)
        dairy_amt = round(random.uniform(450, 750), 2)
        records.append({
            "txn_id": f"TXN-MURUGAN-{txn_counter}",
            "txn_date": f"{day_str} 06:45:00",
            "amount": dairy_amt,
            "direction": "debit",
            "description": "Daily Fresh Milk & Curd Supply Aavin Dairy Booth",
            "channel": "UPI",
            "reference_id": f"DAIRY/{random.randint(1000, 9999)}"
        })
        txn_counter += 1

        # 3. Customer UPI Payments: Morning Rush (7:00 - 11:00) and Evening Rush (16:30 - 21:30)
        num_morning = random.randint(22, 38) if not is_weekend else random.randint(30, 48)
        num_evening = random.randint(18, 30) if not is_weekend else random.randint(25, 42)

        # Morning Sales
        for _ in range(num_morning):
            hour = random.choice([7, 8, 9, 10])
            minute = random.randint(0, 59)
            amt = round(random.choice([35, 45, 55, 60, 75, 80, 110, 140]), 2)
            records.append({
                "txn_id": f"TXN-MURUGAN-{txn_counter}",
                "txn_date": f"{day_str} {hour:02d}:{minute:02d}:{random.randint(10, 59):02d}",
                "amount": amt,
                "direction": "credit",
                "description": f"UPI QR Payment BharatPe QR Murugan Tiffin Cart",
                "channel": "QR",
                "reference_id": f"UPI/{random.randint(1000000000, 9999999999)}"
            })
            txn_counter += 1

        # Evening Sales
        for _ in range(num_evening):
            hour = random.choice([16, 17, 18, 19, 20])
            minute = random.randint(0, 59)
            amt = round(random.choice([30, 40, 50, 70, 90, 120, 150]), 2)
            records.append({
                "txn_id": f"TXN-MURUGAN-{txn_counter}",
                "txn_date": f"{day_str} {hour:02d}:{minute:02d}:{random.randint(10, 59):02d}",
                "amount": amt,
                "direction": "credit",
                "description": f"UPI Payment received from customer via PhonePe QR",
                "channel": "QR",
                "reference_id": f"UPI/{random.randint(1000000000, 9999999999)}"
            })
            txn_counter += 1

        # 4. Commercial LPG Cylinder Refill (Every 10 days)
        if current_date.day in [4, 14, 24]:
            records.append({
                "txn_id": f"TXN-MURUGAN-{txn_counter}",
                "txn_date": f"{day_str} 14:00:00",
                "amount": 1780.0,
                "direction": "debit",
                "description": "Commercial Blue 19kg LPG Cylinder Indane Gas",
                "channel": "UPI",
                "reference_id": f"GAS/{random.randint(1000, 9999)}"
            })
            txn_counter += 1

        # 5. Weekly Stall Maintenance & Waste Removal Fee (Mondays)
        if current_date.weekday() == 0:
            records.append({
                "txn_id": f"TXN-MURUGAN-{txn_counter}",
                "txn_date": f"{day_str} 12:30:00",
                "amount": 750.0,
                "direction": "debit",
                "description": "Weekly Vendor Cart Spot Maintenance & Waste Removal",
                "channel": "UPI",
                "reference_id": f"SPOT/{random.randint(1000, 9999)}"
            })
            txn_counter += 1

        # 6. Occasional Personal Self-Transfer (Excluded from business calculation)
        if current_date.day in [7, 21]:
            records.append({
                "txn_id": f"TXN-MURUGAN-{txn_counter}",
                "txn_date": f"{day_str} 21:45:00",
                "amount": 2500.0,
                "direction": "debit",
                "description": "Transfer to self own savings account / family support",
                "channel": "IMPS",
                "reference_id": f"SELF/{random.randint(1000, 9999)}"
            })
            txn_counter += 1

        current_date += timedelta(days=1)

    df = pd.DataFrame(records)
    return df.to_csv(index=False)

def generate_ramesh_kirana_csv() -> str:
    """Ramesh Kirana Store: 90 days of transactions."""
    random.seed(42)
    records = []
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=90)
    current_date = start_date
    txn_counter = 1001

    fmcg_suppliers = ["Metro Wholesale", "Balaji Grain Traders", "Amul Dairy Distributor", "HUL Stockist", "Fortune Oil Agency"]
    upi_handles = ["paytmqr", "phonepe.merchant", "bharatpe", "gpay", "upi"]

    while current_date <= end_date:
        day_str = current_date.strftime("%Y-%m-%d")
        is_sunday = current_date.weekday() == 6

        num_sales = random.randint(8, 15) if is_sunday else random.randint(14, 26)
        for _ in range(num_sales):
            hour = random.choice([8, 9, 10, 11, 12, 16, 17, 18, 19, 20, 21])
            minute = random.randint(0, 59)
            amt = round(random.choice([
                random.uniform(45, 180),
                random.uniform(120, 450),
                random.uniform(350, 1200),
                random.uniform(900, 2400)
            ]), 2)
            cust_id = random.randint(100, 999)
            records.append({
                "txn_id": f"TXN-RAMESH-{txn_counter}",
                "txn_date": f"{day_str} {hour:02d}:{minute:02d}:{random.randint(10, 59):02d}",
                "amount": amt,
                "direction": "credit",
                "description": f"UPI Payment received from Cust-{cust_id} via {random.choice(upi_handles)}",
                "channel": "UPI",
                "reference_id": f"UPI/{random.randint(1000000000, 9999999999)}"
            })
            txn_counter += 1

        if current_date.weekday() in [1, 4]:
            supplier = random.choice(fmcg_suppliers)
            sup_amt = round(random.uniform(8500, 19500), 2)
            records.append({
                "txn_id": f"TXN-RAMESH-{txn_counter}",
                "txn_date": f"{day_str} 14:30:00",
                "amount": sup_amt,
                "direction": "debit",
                "description": f"Wholesale Inventory Restock payment to {supplier}",
                "channel": "IMPS",
                "reference_id": f"SUP/{supplier[:4].upper()}/{random.randint(10000, 99999)}"
            })
            txn_counter += 1

        if current_date.day == 5:
            records.append({
                "txn_id": f"TXN-RAMESH-{txn_counter}",
                "txn_date": f"{day_str} 10:00:00",
                "amount": 12000.0,
                "direction": "debit",
                "description": "Commercial Shop Rent to Landlord Sharma Ji",
                "channel": "UPI",
                "reference_id": f"RENT/{current_date.strftime('%b%y')}"
            })
            txn_counter += 1

        if current_date.day == 12:
            records.append({
                "txn_id": f"TXN-RAMESH-{txn_counter}",
                "txn_date": f"{day_str} 11:15:00",
                "amount": round(random.uniform(2200, 3100), 2),
                "direction": "debit",
                "description": "Electricity Utility Bill Payment BSES Rajdhani",
                "channel": "BBPS",
                "reference_id": f"UTIL/ELEC/{random.randint(1000, 9999)}"
            })
            txn_counter += 1

        if current_date.day == 18:
            records.append({
                "txn_id": f"TXN-RAMESH-{txn_counter}",
                "txn_date": f"{day_str} 09:00:00",
                "amount": 3200.0,
                "direction": "debit",
                "description": "NACH Auto-Debit Micro-Finance EMI Bajaj Fin",
                "channel": "NACH",
                "reference_id": f"NACH/EMI/{random.randint(100000, 999999)}"
            })
            txn_counter += 1

        if current_date.day in [10, 25]:
            records.append({
                "txn_id": f"TXN-RAMESH-{txn_counter}",
                "txn_date": f"{day_str} 19:40:00",
                "amount": round(random.uniform(3000, 7000), 2),
                "direction": "debit",
                "description": "Transfer to self savings account / personal drawings",
                "channel": "IMPS",
                "reference_id": f"SELF/{random.randint(1000, 9999)}"
            })
            txn_counter += 1

        current_date += timedelta(days=1)

    df = pd.DataFrame(records)
    return df.to_csv(index=False)

def generate_priya_gourmet_csv() -> str:
    """Priya Street Gourmet: 90 days of street food stall transactions."""
    random.seed(101)
    records = []
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=90)
    current_date = start_date
    txn_counter = 2001

    while current_date <= end_date:
        day_str = current_date.strftime("%Y-%m-%d")
        is_weekend = current_date.weekday() in [4, 5, 6]

        mandi_amt = round(random.uniform(1600, 2900) if not is_weekend else random.uniform(2500, 4200), 2)
        records.append({
            "txn_id": f"TXN-PRIYA-{txn_counter}",
            "txn_date": f"{day_str} 07:15:00",
            "amount": mandi_amt,
            "direction": "debit",
            "description": "Daily Mandi Raw Material Spices & Vegetable Supplier",
            "channel": "UPI",
            "reference_id": f"MANDI/{random.randint(10000, 99999)}"
        })
        txn_counter += 1

        num_sales = random.randint(40, 75) if is_weekend else random.randint(22, 45)
        for _ in range(num_sales):
            hour = random.choice([16, 17, 18, 19, 20, 21, 22, 23])
            minute = random.randint(0, 59)
            amt = round(random.choice([50, 70, 90, 120, 150, 180, 240, 320]), 2)
            records.append({
                "txn_id": f"TXN-PRIYA-{txn_counter}",
                "txn_date": f"{day_str} {hour:02d}:{minute:02d}:{random.randint(10, 59):02d}",
                "amount": amt,
                "direction": "credit",
                "description": f"UPI QR Payment BharatPe QR Food Stall Priya Gourmet",
                "channel": "QR",
                "reference_id": f"QR/{random.randint(10000000, 99999999)}"
            })
            txn_counter += 1

        if current_date.day in [3, 13, 23]:
            records.append({
                "txn_id": f"TXN-PRIYA-{txn_counter}",
                "txn_date": f"{day_str} 11:30:00",
                "amount": 1780.0,
                "direction": "debit",
                "description": "Commercial LPG Cylinder Refill Indane Gas",
                "channel": "UPI",
                "reference_id": f"GAS/{random.randint(1000, 9999)}"
            })
            txn_counter += 1

        if current_date.weekday() == 0:
            records.append({
                "txn_id": f"TXN-PRIYA-{txn_counter}",
                "txn_date": f"{day_str} 12:00:00",
                "amount": 800.0,
                "direction": "debit",
                "description": "Weekly Vendor Stall Space & Cleanliness Maintenance Fee",
                "channel": "UPI",
                "reference_id": f"FEE/{random.randint(1000, 9999)}"
            })
            txn_counter += 1

        current_date += timedelta(days=1)

    df = pd.DataFrame(records)
    return df.to_csv(index=False)

def generate_anil_logistics_csv() -> str:
    """Anil Quick Logistics: 90 days of freight & delivery receipts."""
    random.seed(303)
    records = []
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=90)
    current_date = start_date
    txn_counter = 3001

    clients = ["Delhivery Depot Hub", "Amazon Logistics Sort Center", "City Express Parcels", "Local Furniture Hub"]

    while current_date <= end_date:
        day_str = current_date.strftime("%Y-%m-%d")

        if current_date.weekday() in [1, 3, 5]:
            client = random.choice(clients)
            rec_amt = round(random.uniform(6500, 22000), 2)
            records.append({
                "txn_id": f"TXN-ANIL-{txn_counter}",
                "txn_date": f"{day_str} 15:45:00",
                "amount": rec_amt,
                "direction": "credit",
                "description": f"NEFT Inward Freight Settlement from {client}",
                "channel": "NEFT",
                "reference_id": f"NEFT/SETTLE/{random.randint(100000, 999999)}"
            })
            txn_counter += 1

        fuel_amt = round(random.uniform(900, 2800), 2)
        records.append({
            "txn_id": f"TXN-ANIL-{txn_counter}",
            "txn_date": f"{day_str} 08:30:00",
            "amount": fuel_amt,
            "direction": "debit",
            "description": "Indian Oil Fuel Pump Commercial Diesel",
            "channel": "POS",
            "reference_id": f"IOCL/{random.randint(10000, 99999)}"
        })
        txn_counter += 1

        if current_date.weekday() in [2, 6]:
            records.append({
                "txn_id": f"TXN-ANIL-{txn_counter}",
                "txn_date": f"{day_str} 14:10:00",
                "amount": round(random.uniform(450, 1100), 2),
                "direction": "debit",
                "description": "FASTag National Highway Toll Plaza Debit",
                "channel": "FASTAG",
                "reference_id": f"TOLL/{random.randint(10000, 99999)}"
            })
            txn_counter += 1

        if current_date.day == 10:
            records.append({
                "txn_id": f"TXN-ANIL-{txn_counter}",
                "txn_date": f"{day_str} 09:30:00",
                "amount": 14500.0,
                "direction": "debit",
                "description": "ECS Debit Tata Motors Finance Commercial Vehicle Loan",
                "channel": "ECS",
                "reference_id": f"ECS/LOAN/{random.randint(100000, 999999)}"
            })
            txn_counter += 1

        if current_date.day == 22:
            records.append({
                "txn_id": f"TXN-ANIL-{txn_counter}",
                "txn_date": f"{day_str} 17:00:00",
                "amount": round(random.uniform(3500, 7500), 2),
                "direction": "debit",
                "description": "Vehicle Periodic Maintenance & Tyre Replacement",
                "channel": "UPI",
                "reference_id": f"SERVICE/{random.randint(1000, 9999)}"
            })
            txn_counter += 1

        current_date += timedelta(days=1)

    df = pd.DataFrame(records)
    return df.to_csv(index=False)
