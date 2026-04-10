// Auto-generate this file with: npm run db:types
// This is a placeholder until you run: supabase gen types typescript --local > src/lib/supabase/types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type OrgType = "masjid" | "temple" | "church" | "gurudwara" | "other";
export type OrgStatus = "active" | "suspended" | "trial" | "cancelled";
export type UserRole = "super_admin" | "org_admin" | "org_staff" | "member";
export type BillingCycle = "monthly" | "quarterly" | "half_yearly" | "yearly" | "one_time" | "custom";
export type SubscriptionStatus = "active" | "overdue" | "paused" | "cancelled" | "expired";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded" | "waived";
export type PaymentMethod = "cash" | "upi" | "card" | "net_banking" | "cheque" | "bank_transfer" | "other";
export type MemberStatus = "active" | "inactive" | "deceased";

// Platform subscription types (Znifa billing)
export type PlatformPlanStatus = "active" | "trial" | "past_due" | "cancelled" | "expired";
export type PlatformInterval = "monthly" | "yearly";

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          slug: string;
          name: string;
          org_type: OrgType;
          status: OrgStatus;
          logo_url: string | null;
          address: string | null;
          city: string | null;
          state: string | null;
          pincode: string | null;
          phone: string | null;
          email: string | null;
          website: string | null;
          cashfree_app_id: string | null;
          cashfree_secret: string | null;
          cashfree_env: string;
          timezone: string;
          currency: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["organizations"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["organizations"]["Insert"]>;
      };
      org_members: {
        Row: {
          id: string;
          org_id: string;
          user_id: string;
          role: UserRole;
          invited_by: string | null;
          joined_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["org_members"]["Row"], "id" | "joined_at">;
        Update: Partial<Database["public"]["Tables"]["org_members"]["Insert"]>;
      };
      members: {
        Row: {
          id: string;
          org_id: string;
          user_id: string | null;
          member_number: string | null;
          first_name: string;
          last_name: string | null;
          phone: string;
          email: string | null;
          address: string | null;
          city: string | null;
          pincode: string | null;
          membership_type: string | null;
          status: MemberStatus;
          notes: string | null;
          avatar_url: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["members"]["Row"], "id" | "member_number" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["members"]["Insert"]>;
      };
      subscription_plans: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          description: string | null;
          amount: number;
          billing_cycle: BillingCycle;
          custom_days: number | null;
          is_active: boolean;
          allows_partial: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["subscription_plans"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["subscription_plans"]["Insert"]>;
      };
      subscriptions: {
        Row: {
          id: string;
          org_id: string;
          member_id: string;
          plan_id: string;
          status: SubscriptionStatus;
          start_date: string;
          end_date: string | null;
          next_due_date: string | null;
          amount_override: number | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["subscriptions"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["subscriptions"]["Insert"]>;
      };
      payments: {
        Row: {
          id: string;
          org_id: string;
          subscription_id: string | null;
          member_id: string;
          amount: number;
          currency: string;
          payment_method: PaymentMethod;
          payment_status: PaymentStatus;
          cf_order_id: string | null;
          cf_payment_id: string | null;
          cf_signature: string | null;
          reference_number: string | null;
          receipt_number: string | null;
          collected_by: string | null;
          payment_date: string;
          period_start: string | null;
          period_end: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["payments"]["Row"], "id" | "receipt_number" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["payments"]["Insert"]>;
      };
      payment_audit_log: {
        Row: {
          id: string;
          payment_id: string;
          org_id: string;
          old_status: PaymentStatus | null;
          new_status: PaymentStatus;
          changed_by: string | null;
          notes: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["payment_audit_log"]["Row"], "id" | "created_at">;
        Update: never;
      };
      platform_plans: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          price_monthly: number;
          price_yearly: number;
          max_members: number | null;
          max_staff: number | null;
          features: Json;
          is_active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["platform_plans"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["platform_plans"]["Insert"]>;
      };
      org_platform_subs: {
        Row: {
          id: string;
          org_id: string;
          plan_id: string;
          status: PlatformPlanStatus;
          billing_interval: PlatformInterval;
          trial_ends_at: string | null;
          current_period_start: string | null;
          current_period_end: string | null;
          cf_order_id: string | null;
          cf_payment_id: string | null;
          cancel_at_period_end: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["org_platform_subs"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["org_platform_subs"]["Insert"]>;
      };
      platform_payments: {
        Row: {
          id: string;
          org_id: string;
          sub_id: string | null;
          plan_id: string;
          amount: number;
          currency: string;
          billing_interval: PlatformInterval;
          payment_status: PaymentStatus;
          cf_order_id: string | null;
          cf_payment_id: string | null;
          period_start: string | null;
          period_end: string | null;
          paid_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["platform_payments"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["platform_payments"]["Insert"]>;
      };
    };
    Functions: {
      get_user_role_in_org: {
        Args: { p_org_id: string };
        Returns: UserRole;
      };
      is_super_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      record_manual_payment: {
        Args: {
          p_org_id: string;
          p_member_id: string;
          p_subscription_id: string | null;
          p_amount: number;
          p_payment_method: PaymentMethod;
          p_payment_date: string;
          p_reference_number?: string | null;
          p_period_start?: string | null;
          p_period_end?: string | null;
          p_notes?: string | null;
          p_next_due_date?: string | null;
        };
        Returns: Database["public"]["Tables"]["payments"]["Row"];
      };
      get_org_dashboard_stats: {
        Args: { p_org_id: string };
        Returns: Json;
      };
      get_org_platform_sub: {
        Args: { p_org_id: string };
        Returns: Json;
      };
      activate_platform_sub: {
        Args: {
          p_org_id: string;
          p_plan_id: string;
          p_cf_order_id: string;
          p_cf_payment_id: string;
          p_interval?: PlatformInterval;
          p_amount?: number;
        };
        Returns: void;
      };
      start_org_trial: {
        Args: { p_org_id: string };
        Returns: void;
      };
    };
    Enums: {
      org_type: OrgType;
      org_status: OrgStatus;
      user_role: UserRole;
      billing_cycle: BillingCycle;
      subscription_status: SubscriptionStatus;
      payment_status: PaymentStatus;
      payment_method: PaymentMethod;
      member_status: MemberStatus;
      platform_plan_status: PlatformPlanStatus;
      platform_interval: PlatformInterval;
    };
  };
}

export type Organization = Database["public"]["Tables"]["organizations"]["Row"];
export type OrgMember = Database["public"]["Tables"]["org_members"]["Row"];
export type Member = Database["public"]["Tables"]["members"]["Row"];
export type SubscriptionPlan = Database["public"]["Tables"]["subscription_plans"]["Row"];
export type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];
export type Payment = Database["public"]["Tables"]["payments"]["Row"];
export type PaymentAuditLog = Database["public"]["Tables"]["payment_audit_log"]["Row"];
export type PlatformPlan = Database["public"]["Tables"]["platform_plans"]["Row"];
export type OrgPlatformSub = Database["public"]["Tables"]["org_platform_subs"]["Row"];
export type PlatformPayment = Database["public"]["Tables"]["platform_payments"]["Row"];

// Convenience type returned by get_org_platform_sub RPC
export interface OrgPlatformSubDetails {
  sub_id: string;
  plan_id: string;
  plan_name: string;
  plan_slug: string;
  status: PlatformPlanStatus;
  billing_interval: PlatformInterval;
  trial_ends_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  price_monthly: number;
  price_yearly: number;
  max_members: number | null;
  features: string[];
}
