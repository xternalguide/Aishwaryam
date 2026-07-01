-- Aiswaryam At your Home - Production PostgreSQL Schema
-- Total Tables: 33

-- ==========================================
-- 1. USERS & ADMINS (CORE ENTITIES)
-- ==========================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(15) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    full_name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    kyc_level VARCHAR(20) DEFAULT 'BASIC', -- BASIC, AADHAAR, FULL
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 2. AUTHENTICATION & SESSIONS
-- ==========================================

CREATE TABLE auth_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    refresh_token VARCHAR(512) NOT NULL,
    device_fingerprint VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE otp_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(15) NOT NULL,
    otp_hash VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 3. KYC (KNOW YOUR CUSTOMER)
-- ==========================================

CREATE TABLE kyc_details (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    pan_number_encrypted TEXT,
    aadhaar_masked VARCHAR(20),
    dob DATE,
    verification_status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
    verified_by UUID REFERENCES admin_users(id), -- Now properly references admin_users
    verified_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE kyc_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL, -- PAN, AADHAAR_FRONT, AADHAAR_BACK
    document_number VARCHAR(100),
    document_url TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'UNDER_REVIEW',
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 4. WALLET & LEDGER
-- ==========================================

CREATE TABLE wallets (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    inr_balance_paise BIGINT DEFAULT 0, -- ₹1 = 100 paise
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE wallet_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    transaction_type VARCHAR(20) NOT NULL, -- CREDIT, DEBIT
    amount_paise BIGINT NOT NULL,
    reference_id VARCHAR(100) NOT NULL, -- E.g., payment_id, withdrawal_id
    description TEXT,
    ip_address VARCHAR(45) NOT NULL, -- Compliance
    device_fingerprint VARCHAR(255) NOT NULL, -- Compliance
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 5. GOLD HOLDINGS & TRANSACTIONS
-- ==========================================

CREATE TABLE gold_holdings (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    gold_balance_mg BIGINT DEFAULT 0, -- 1g = 1000 mg
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE gold_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    transaction_type VARCHAR(10) NOT NULL, -- BUY, SELL
    gold_weight_mg BIGINT NOT NULL,
    price_per_gm_paise BIGINT NOT NULL,
    total_amount_paise BIGINT NOT NULL,
    ip_address VARCHAR(45) NOT NULL, -- Compliance
    device_fingerprint VARCHAR(255) NOT NULL, -- Compliance
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_schemes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    plan_name VARCHAR(100) NOT NULL,
    auto_pay_enabled BOOLEAN DEFAULT FALSE,
    payment_frequency VARCHAR(20) NOT NULL,
    installment_amount_paise BIGINT NOT NULL,
    installments_paid INTEGER DEFAULT 0,
    total_installments INTEGER NOT NULL,
    next_due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    accumulated_gold_mg BIGINT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE gold_price_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buy_price_paise BIGINT NOT NULL,
    sell_price_paise BIGINT NOT NULL,
    is_admin_override BOOLEAN DEFAULT FALSE,
    admin_id UUID REFERENCES admin_users(id), -- Now properly references admin_users
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 6. PAYMENTS & WITHDRAWALS
-- ==========================================

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    provider_order_id VARCHAR(100) NOT NULL,
    provider_payment_id VARCHAR(100),
    amount_paise BIGINT NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, SUCCESS, FAILED
    ip_address VARCHAR(45) NOT NULL, -- Compliance
    device_fingerprint VARCHAR(255) NOT NULL, -- Compliance
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    account_number_encrypted TEXT NOT NULL,
    ifsc_code VARCHAR(20) NOT NULL,
    bank_name VARCHAR(100),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    bank_account_id UUID REFERENCES bank_accounts(id),
    amount_paise BIGINT NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, PROCESSING, COMPLETED, FAILED
    failure_reason TEXT,
    ip_address VARCHAR(45) NOT NULL, -- Compliance
    device_fingerprint VARCHAR(255) NOT NULL, -- Compliance
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE
);

-- ==========================================
-- 7. SYSTEM LOGS & AUDIT
-- ==========================================

CREATE TABLE api_error_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id VARCHAR(100),
    endpoint VARCHAR(255),
    error_code VARCHAR(50),
    stack_trace TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE login_attempt_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(15),
    ip_address VARCHAR(45) NOT NULL,
    is_success BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE webhook_event_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider VARCHAR(50) NOT NULL, -- RAZORPAY, KYC_PROVIDER
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    is_processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY, -- Sequential for tamper evidence
    admin_id UUID REFERENCES admin_users(id),
    action VARCHAR(100) NOT NULL,
    entity_name VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE admin_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 8. NOTIFICATIONS
-- ==========================================

CREATE TABLE notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_name VARCHAR(100) UNIQUE NOT NULL,
    title_template VARCHAR(255) NOT NULL,
    body_template TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 9. GROWTH (REFERRALS & OFFERS)
-- ==========================================

CREATE TABLE referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    referral_code VARCHAR(20) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE referral_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_user_id UUID REFERENCES users(id),
    referee_user_id UUID UNIQUE REFERENCES users(id), -- A user can only be referred once
    reward_status VARCHAR(20) DEFAULT 'PENDING',
    bonus_awarded_mg BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offer_code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    discount_paise BIGINT,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE user_offer_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    offer_id UUID REFERENCES offers(id),
    redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, offer_id) -- Prevent double redemption
);

-- ==========================================
-- 10. CORE ENGINEERING
-- ==========================================

CREATE TABLE idempotency_keys (
    key VARCHAR(255) PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    endpoint VARCHAR(255) NOT NULL,
    response_body JSONB,
    response_status INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 11. COMPLIANCE & FRAUD TRACKING
-- ==========================================

CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID REFERENCES gold_transactions(id) ON DELETE CASCADE,
    base_amount_paise BIGINT NOT NULL,
    gst_amount_paise BIGINT NOT NULL,
    total_amount_paise BIGINT NOT NULL,
    invoice_pdf_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    reference_id VARCHAR(100), -- payment_id or transaction_id
    status VARCHAR(20) DEFAULT 'OPEN', -- OPEN, RESOLVED, CLOSED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE dispute_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispute_id UUID REFERENCES disputes(id) ON DELETE CASCADE,
    sender_type VARCHAR(10) NOT NULL, -- USER or ADMIN
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_activity_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL, -- E.g., VIEWED_BUY_PAGE, ATTEMPTED_WITHDRAWAL
    ip_address VARCHAR(45) NOT NULL,
    device_fingerprint VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 8. SCHEMES MASTER (Admin Defined)
-- ==========================================

CREATE TABLE schemes_master (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_name VARCHAR(100) NOT NULL,
    description TEXT,
    installment_amount_paise BIGINT NOT NULL,
    total_installments INT NOT NULL, -- E.g. 330 days
    frequency VARCHAR(20) DEFAULT 'Daily',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO schemes_master (plan_name, description, installment_amount_paise, total_installments)
VALUES 
('Daily Gold Savings', 'Save daily and get gold after 11 months with zero wastage.', 50000, 330),
('Mahalakshmi Scheme', 'Monthly gold investment plan with special bonus.', 500000, 11);

