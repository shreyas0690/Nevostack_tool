# Razorpay Payment Integration Setup Guide

## 🚀 Complete Enterprise Billing & Payment System

### 📋 What's Been Implemented:

#### **Backend Features:**
1. **Razorpay Service** (`backend/services/razorpayService.js`)
   - Order creation
   - Payment verification
   - Customer management
   - Subscription handling
   - Refund processing

2. **Billing Models:**
   - `Billing.js` - Invoice and payment tracking
   - `Subscription.js` - Plan management and auto-renewal
   - `Payment.js` - Payment processing records

3. **API Endpoints:**
   - `POST /api/company/create-payment-order` - Create payment order
   - `POST /api/company/verify-payment` - Verify payment and complete registration
   - `GET /api/billing/*` - Complete billing management APIs

#### **Frontend Features:**
1. **PaymentModal Component** (`src/components/Payment/PaymentModal.tsx`)
   - Razorpay checkout integration
   - Payment status handling
   - Success/failure management

2. **Enhanced Company Registration:**
   - Automatic payment flow for paid plans
   - Free plan registration
   - Complete subscription creation

### 🔧 Setup Instructions:

#### **1. Razorpay Account Setup:**
1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Create account or login
3. Get your API keys from Settings > API Keys
4. Copy Key ID and Key Secret

#### **2. Environment Variables:**
Add to your `backend/.env` file:
```env
# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_your_key_id_here
RAZORPAY_KEY_SECRET=your_razorpay_key_secret_here

# Frontend Razorpay Key (for checkout)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_key_id_here
```

#### **3. Database Setup:**
The system will automatically create the required collections:
- `billings` - Payment and invoice records
- `subscriptions` - Company subscription management
- `payments` - Payment processing records

### 💳 Payment Flow:

#### **For Paid Plans:**
1. User selects paid plan during registration
2. System creates Razorpay order
3. Payment modal opens with Razorpay checkout
4. User completes payment
5. Payment verification happens
6. Company, subscription, billing, and payment records created
7. User redirected to login

#### **For Free Plans:**
1. User selects free plan
2. Direct registration without payment
3. Trial subscription created
4. User redirected to login

### 🎯 Enterprise Features:

#### **Billing Management:**
- **Automatic Invoice Generation:** Every payment creates an invoice
- **Payment Tracking:** Complete audit trail of all payments
- **Subscription Management:** Auto-renewal, upgrades, cancellations
- **Usage Monitoring:** Real-time usage tracking for limits

#### **Security Features:**
- **Payment Verification:** Razorpay signature verification
- **Secure Data Handling:** No card details stored
- **Audit Trail:** Complete transaction history
- **PCI Compliance:** Razorpay handles PCI compliance

#### **Multi-Currency Support:**
- **INR Primary:** Default currency for Indian market
- **USD/EUR Ready:** Easy to add more currencies
- **Localized Pricing:** Proper currency formatting

### 📊 Billing Dashboard:

The system includes a complete billing dashboard (`src/components/Billing/BillingDashboard.tsx`) with:
- Current subscription status
- Usage monitoring (users, departments, storage)
- Billing history
- Upcoming payments
- Plan management

### 🔄 Complete Registration Flow:

#### **Step 1: Company Details**
- Company name, domain, email
- Address information
- Contact details

#### **Step 2: Plan Selection**
- Dynamic plans from backend
- Pricing display (Free/Paid)
- Billing cycle selection
- Feature comparison

#### **Step 3: Admin User**
- Admin user creation
- Password setup
- User preferences

#### **Step 4: Payment (if paid plan)**
- Razorpay checkout
- Payment processing
- Verification
- Complete registration

#### **Step 5: Success**
- Company created
- Subscription active
- Admin user ready
- Redirect to login

### 🚀 Production Deployment:

#### **1. Razorpay Production Keys:**
- Switch to live mode in Razorpay dashboard
- Update environment variables with live keys
- Test with real payment methods

#### **2. Webhook Setup:**
- Configure Razorpay webhooks for:
  - `payment.captured`
  - `payment.failed`
  - `subscription.charged`
  - `subscription.cancelled`

#### **3. Security:**
- Use HTTPS in production
- Validate all webhook signatures
- Implement rate limiting
- Monitor payment failures

### 📈 Analytics & Reporting:

The system provides:
- Payment success rates
- Revenue tracking
- Subscription analytics
- Usage statistics
- Customer insights

### 🎉 Ready for Enterprise Use!

Your company registration system now includes:
- ✅ Complete payment processing
- ✅ Subscription management
- ✅ Billing automation
- ✅ Invoice generation
- ✅ Usage tracking
- ✅ Multi-currency support
- ✅ Security compliance
- ✅ Enterprise scalability

**Next Steps:**
1. Set up Razorpay account and get API keys
2. Update environment variables
3. Test the complete flow
4. Deploy to production
5. Configure webhooks for real-time updates

Your enterprise website is now ready with complete billing and payment integration! 🚀
