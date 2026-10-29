"use client";

import React, { useState } from "react";
import {
  Users,
  UserPlus,
  Shield,
  Mail,
  Phone,
  Crown,
  Power,
  PowerOff,
  Trash2,
  X,
  Save,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  createAdminUserAction,
  toggleAdminActiveAction,
  deleteAdminUserAction,
  updateAdminRoleAction,
} from "@/app/admin/admin-user-actions";

type Admin = {
  id: string;
  full_name: string;
  phone: string;
  role: string;
  is_active: boolean;
  created_at: string;
  email: string;
};

const ROLE_OPTIONS = [
  {
    value: "owner",
    label: "مالك المتجر",
    color: "bg-purple-50 text-purple-700 border-purple-200",
    icon: <Crown className="w-3 h-3" />,
  },
  {
    value: "admin",
    label: "مدير عام",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    icon: <Shield className="w-3 h-3" />,
  },
  {
    value: "order_manager",
    label: "مدير طلبات",
    color: "bg-sky-50 text-sky-700 border-sky-200",
    icon: null,
  },
  {
    value: "inventory_manager",
    label: "مدير مخزون",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: null,
  },
  {
    value: "viewer",
    label: "مشاهدة فقط",
    color: "bg-gray-50 text-gray-700 border-gray-200",
    icon: null,
  },
];

// ✅ الحل: تعريف قيمة افتراضية ثابتة بدلاً من الوصول لمصفوفة
const DEFAULT_ROLE_INFO = {
  value: "viewer",
  label: "مشاهدة فقط",
  color: "bg-gray-50 text-gray-700 border-gray-200",
  icon: null,
};

function getRoleInfo(role: string) {
  return ROLE_OPTIONS.find((r) => r.value === role) ?? DEFAULT_ROLE_INFO;
}

export default function AdminsManagerClient({
  initialAdmins,
  currentUserId,
}: {
  initialAdmins: Admin[];
  currentUserId: string;
}) {
  const [admins, setAdmins] = useState<Admin[]>(initialAdmins);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    phone: "",
    role: "admin",
  });

  const stats = {
    total: admins.length,
    active: admins.filter((a) => a.is_active).length,
    inactive: admins.filter((a) => !a.is_active).length,
  };

  function openCreateModal() {
    setForm({
      full_name: "",
      email: "",
      password: "",
      phone: "",
      role: "admin",
    });
    setIsModalOpen(true);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    const formData = new FormData();
    formData.append("full_name", form.full_name);
    formData.append("email", form.email);
    formData.append("password", form.password);
    formData.append("phone", form.phone);
    formData.append("role", form.role);

    const res = await createAdminUserAction(formData);
    setIsSaving(false);

    if (res.success) {
      setFeedback({
        type: "success",
        text: "تم إنشاء حساب المشرف بنجاح",
      });
      setIsModalOpen(false);
      window.location.reload();
    } else {
      setFeedback({ type: "error", text: res.error || "حدث خطأ" });
    }
  }

  async function handleToggle(admin: Admin) {
    setLoadingId(admin.id);
    setFeedback(null);
    const res = await toggleAdminActiveAction(admin.id, !admin.is_active);
    setLoadingId(null);
    if (res.success) {
      setAdmins((prev) =>
        prev.map((a) =>
          a.id === admin.id ? { ...a, is_active: !admin.is_active } : a
        )
      );
      setFeedback({
        type: "success",
        text: admin.is_active ? "تم تعطيل الحساب" : "تم تفعيل الحساب",
      });
    } else {
      setFeedback({ type: "error", text: res.error || "فشل التحديث" });
    }
  }

  async function handleDelete(admin: Admin) {
    if (
      !confirm(
        `هل تريد حذف حساب "${admin.full_name}" (${admin.email})؟ لا يمكن التراجع.`
      )
    )
      return;

    setLoadingId(admin.id);
    setFeedback(null);
    const res = await deleteAdminUserAction(admin.id);
    setLoadingId(null);
    if (res.success) {
      setAdmins((prev) => prev.filter((a) => a.id !== admin.id));
      setFeedback({ type: "success", text: "تم حذف الحساب" });
    } else {
      setFeedback({ type: "error", text: res.error || "فشل الحذف" });
    }
  }

  async function handleRoleChange(admin: Admin, newRole: string) {
    setLoadingId(admin.id);
    setFeedback(null);
    const res = await updateAdminRoleAction(admin.id, newRole);
    setLoadingId(null);
    if (res.success) {
      setAdmins((prev) =>
        prev.map((a) => (a.id === admin.id ? { ...a, role: newRole } : a))
      );
      setFeedback({ type: "success", text: "تم تحديث الدور" });
    } else {
      setFeedback({ type: "error", text: res.error || "فشل التحديث" });
    }
  }

  const inputClass =
    "w-full bg-white border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 transition-colors";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-600" />
            إدارة المشرفين
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            أضف مشرفين بصلاحيات محددة لإدارة المتجر والطلبات
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          مشرف جديد
        </button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-sm font-semibold flex items-center justify-between ${
            feedback.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-rose-50 border border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-gray-500 hover:text-gray-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-[10px] text-gray-500 mb-1 font-medium">
            إجمالي المشرفين
          </p>
          <p className="text-lg font-extrabold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white border border-emerald-200 rounded-xl p-4 shadow-sm">
          <p className="text-[10px] text-emerald-600 mb-1 font-medium">نشط</p>
          <p className="text-lg font-extrabold text-emerald-600">
            {stats.active}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-[10px] text-gray-500 mb-1 font-medium">معطل</p>
          <p className="text-lg font-extrabold text-gray-500">
            {stats.inactive}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-xs text-gray-600 font-bold">
                <th className="p-4">المشرف</th>
                <th className="p-4">البريد الإلكتروني</th>
                <th className="p-4">الدور</th>
                <th className="p-4">الحالة</th>
                <th className="p-4">تاريخ الإنشاء</th>
                <th className="p-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {admins.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-500">
                    لا يوجد مشرفون بعد
                  </td>
                </tr>
              ) : (
                admins.map((admin) => {
                  const roleInfo = getRoleInfo(admin.role);
                  const isMe = admin.id === currentUserId;

                  return (
                    <tr
                      key={admin.id}
                      className={`hover:bg-gray-50/50 transition ${
                        loadingId === admin.id ? "opacity-50" : ""
                      }`}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold shrink-0">
                            {admin.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-gray-900 truncate">
                              {admin.full_name}
                              {isMe && (
                                <span className="text-[10px] text-amber-600 font-normal ms-2">
                                  (أنت)
                                </span>
                              )}
                            </p>
                            {admin.phone && (
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {admin.phone}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <span className="text-gray-700 font-mono text-xs flex items-center gap-1">
                          <Mail className="w-3 h-3 text-gray-400" />
                          {admin.email || "—"}
                        </span>
                      </td>

                      <td className="p-4">
                        <select
                          value={admin.role}
                          onChange={(e) =>
                            handleRoleChange(admin, e.target.value)
                          }
                          disabled={isMe || loadingId === admin.id}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border focus:outline-none disabled:opacity-60 cursor-pointer ${roleInfo.color}`}
                        >
                          {ROLE_OPTIONS.map((r) => (
                            <option key={r.value} value={r.value}>
                              {r.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                            admin.is_active
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-gray-50 text-gray-500 border border-gray-200"
                          }`}
                        >
                          {admin.is_active ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" /> نشط
                            </>
                          ) : (
                            <>
                              <PowerOff className="w-3 h-3" /> معطل
                            </>
                          )}
                        </span>
                      </td>

                      <td className="p-4 text-xs text-gray-500">
                        {new Date(admin.created_at).toLocaleDateString("ar-EG")}
                      </td>

                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggle(admin)}
                            disabled={isMe || loadingId === admin.id}
                            title={admin.is_active ? "تعطيل" : "تفعيل"}
                            className={`p-2 rounded-xl border transition disabled:opacity-30 ${
                              admin.is_active
                                ? "bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100"
                                : "bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100"
                            }`}
                          >
                            {admin.is_active ? (
                              <PowerOff className="w-4 h-4" />
                            ) : (
                              <Power className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(admin)}
                            disabled={isMe || loadingId === admin.id}
                            title="حذف"
                            className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 transition disabled:opacity-30"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-gray-200 rounded-2xl max-w-lg w-full p-6 space-y-4 my-8 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-600" />
                إضافة مشرف جديد
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  الاسم الكامل *
                </label>
                <input
                  type="text"
                  required
                  value={form.full_name}
                  onChange={(e) =>
                    setForm({ ...form, full_name: e.target.value })
                  }
                  placeholder="مثال: أحمد محمد"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  البريد الإلكتروني *
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="admin@example.com"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  رقم الموبايل (اختياري)
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="01012345678"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  كلمة المرور * (8 أحرف على الأقل)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    placeholder="••••••••"
                    className={`${inputClass} pe-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  الدور والصلاحيات *
                </label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className={inputClass}
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-gray-500 mt-1.5 leading-relaxed">
                  {form.role === "admin" && "كل الصلاحيات عدا إدارة المالكين"}
                  {form.role === "order_manager" &&
                    "إدارة الطلبات فقط (تغيير الحالة، مراجعة)"}
                  {form.role === "inventory_manager" &&
                    "إدارة المخزون والمنتجات فقط"}
                  {form.role === "viewer" && "مشاهدة فقط دون تعديل"}
                  {form.role === "owner" && "صلاحيات كاملة (حذر!)"}
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-500 disabled:opacity-50 flex items-center gap-2 transition"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      جاري الإنشاء...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      إنشاء الحساب
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}