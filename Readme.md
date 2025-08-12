#  🚀 SaaS Starter Kit — Powered by LoginRadius

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone
?repository-url=https://github.com/indrasen715/react-saas-starter-loginradius
&project-name=react-saas-starter-loginradius
&repo-name=react-saas-starter-loginradius
&env=VITE_LOGINRADIUS_API_KEY,VITE_LOGINRADIUS_WRAPPER_BASE_URL,VITE_LOGINRADIUS_API_BASE_URL
&envDescription=Environment%20variables%20for%20LoginRadius%20Starter
&demo-title=React%20SaaS%20Starter
&demo-description=LoginRadius-powered%20SaaS%20starter%20running%20on%20Vercel
&demo-url=https%3A%2F%2Fexample.com
&demo-image=https%3A%2F%2Fi.imgur.com%2F9bZC5.jpg)


A **B2B SaaS Starter Kit** to help startups ship faster — integrated with **LoginRadius Authentication** and **Partner IAM** for multi-org team management.

---

## Highlights

- **Fast MVP**: Prebuilt auth + org/roles so you can focus on product.
- **Security First**: MFA, passwordless, social login, and compliance (GDPR/CCPA) via LoginRadius.
- **Multi-Tenant Ready**: Organizations, roles, and permissions out of the box.
- **Modern Stack**: React + Vite frontend, deploy on Vercel in minutes.
- **API Layer**: Optional Node.js wrapper using LoginRadius APIs (Auth-Ignite).

---

## Tech Stack

- **Frontend**: React, Vite, TypeScript
- **Auth**: `@loginradius/loginradius-react-sdk`
- **Styling/UI**: Tailwind (and your preferred UI kit)
- **Hosting**: Vercel (recommended)
- **Backend (optional)**: Node.js wrapper with LoginRadius APIs

---

## Architecture (at a glance)

- **Frontend app** (React + Vite)
    - Uses **LoginRadius React SDK** for hosted/embedded auth flows
    - Organization/role-aware routes and guards
- **Partner IAM** (LoginRadius)
    - Manages orgs, roles, and invitations
- **API wrapper (optional)**
    - Small Node layer to centralize server-side calls to LoginRadius

---

## Quick Start

1. **Create a free LoginRadius account**  
     [Sign up for LoginRadius](https://accounts.loginradius.com/auth.aspx?return_url=https://console.loginradius.com/login&action=register "Sign up for LoginRadius")

2. **Enable Authentication**  
     
     [ Console → **Authentication Configuration** ](https://console.loginradius.com/authentication/authentication-configuration "Authentication Configuration")

3. **Create a Brand (Hosted Pages)**  
     
     [Console → **Branding → Hosted Pages** ](https://console.loginradius.com/branding/hosted-pages "Hosted Pages")

4. **Define Roles for Team Management**  
     
     [Console → **Customers → Roles**](https://console.loginradius.com/customers/roles "Roles")

5. **Allow Your Frontend Domain**  
     
     Add: `https://your-app.vercel.app` (and local dev domains)  in 
     [Console → **Tenant → Settings** → Allowed Domains  ](https://console.loginradius.com/tenant/settings "Allowed Domains")

6. **Get Your API Key**  
    
     [ Console → **Tenant → Settings**  ](https://console.loginradius.com/tenant/settings "Tenant Settings")

7. **Generate SOTT** (Secure One-Time Token)  
     Same page → **SOTT** section → Generate or set via API

8. **Add Env Vars**

     Create `.env` in the project root (or set in Vercel):

     ```bash
     VITE_LOGINRADIUS_APIKEY=YOUR_API_KEY
     VITE_LOGINRADIUS_SOTT=YOUR_SOTT
     # Optional, if you use LR email verification links:
     VITE_LOGINRADIUS_VERIFICATION_URL=https://your-app.vercel.app/auth/verify
     # Optional brand for hosted pages:
     VITE_LOGINRADIUS_BRAND_NAME=your-brand
     ```

