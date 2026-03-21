"use client";

import React, { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, RegisterDto } from "@poker/shared";
import api from "@/lib/api";
import { toast } from "sonner";
import { useAuthConfig } from "@/hooks/useAuthConfig";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
    const router = useRouter();
    const { login, isAuthenticated } = useAuth();
    const { data: authConfig, isLoading: configLoading } = useAuthConfig();

    // Redirect if already logged in
    useEffect(() => {
        if (isAuthenticated) {
            router.push('/lobby');
        }
    }, [isAuthenticated, router]);

    // View State: 'login' | 'signup' | 'forgot'
    const [activeView, setActiveView] = useState<'login' | 'signup' | 'forgot'>('login');

    // Forgot Password Wizard Step
    const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);

    // Messages
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // --- FORMS STATES ---
    // Login
    const [loginData, setLoginData] = useState({ email: '', password: '' });

    // RHF for Signup
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset
    } = useForm<RegisterDto>({
        resolver: zodResolver(registerSchema),
    });

    // Forgot Password forms
    const [fpEmail, setFpEmail] = useState('');
    const [fpCode, setFpCode] = useState('');
    const [fpNewData, setFpNewData] = useState({ password: '', confirmPassword: '' });

    // Password Visibility Toggles
    const [showPass, setShowPass] = useState({
        login: false,
        signup: false,
        signupConfirm: false,
        fpNew: false,
        fpConfirm: false
    });

    // Helper: Clear errors when switching views
    useEffect(() => {
        setErrorMsg('');
        setSuccessMsg('');
        reset();
    }, [activeView, forgotStep, reset]);

    // HANDLERS

    const handleLoginSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setErrorMsg('');

        // Basic Validation
        if (!loginData.email || !loginData.password) {
            setErrorMsg('All fields are required.');
            return;
        }

        try {
            const response = await api.post('/auth/login', {
                email: loginData.email,
                password: loginData.password,
            });

            // Use AuthContext to login
            const { accessToken, user } = response.data;
            login(accessToken, user);

            toast.success(`Welcome back, ${user.username}!`);
            router.push('/lobby');
        } catch (error: unknown) {
            const msg = (error as any).response?.data?.message || 'Login failed';
            toast.error(msg);
            setErrorMsg(msg);
        }
    };

    const onSignupSubmit = async (data: RegisterDto) => {
        try {
            await api.post('/auth/register', data);
            toast.success("Account created successfully! Please log in.");
            reset();
            setTimeout(() => {
                setActiveView('login');
            }, 1000);
        } catch (error: unknown) {
            const msg = (error as any).response?.data?.message || "Registration failed";
            toast.error(msg);
            setErrorMsg(msg);
        }
    };

    // Forgot Password Wizard Handlers
    const handleFpStep1 = async (e: FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        if (!fpEmail) { setErrorMsg('Email is required'); return; }

        try {
            await api.post('/auth/forgot-password', { email: fpEmail });
            setSuccessMsg('Reset code sent! Check the API console logs.');
            toast.success('Reset code sent! Check docker compose logs api');
            setTimeout(() => {
                setSuccessMsg('');
                setForgotStep(2);
            }, 1500);
        } catch (error: unknown) {
            const msg = (error as any).response?.data?.message || 'Failed to send reset code';
            setErrorMsg(msg);
            toast.error(msg);
        }
    };

    const handleFpStep2 = (e: FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        if (!fpCode || fpCode.length !== 6) {
            setErrorMsg('Please enter the 6-digit code from the console');
            return;
        }
        // Code will be validated when resetting password
        setSuccessMsg('Code entered. Set your new password.');
        setTimeout(() => {
            setSuccessMsg('');
            setForgotStep(3);
        }, 500);
    };

    const handleFpStep3 = async (e: FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        if (fpNewData.password !== fpNewData.confirmPassword) {
            setErrorMsg('Passwords do not match');
            return;
        }
        if (fpNewData.password.length < 8) {
            setErrorMsg('Password must be at least 8 characters');
            return;
        }

        try {
            await api.post('/auth/reset-password', {
                token: fpCode,
                newPassword: fpNewData.password,
            });
            toast.success('Password reset successfully!');
            setSuccessMsg('Password reset successfully!');
            setTimeout(() => {
                setActiveView('login');
                setForgotStep(1);
                setFpEmail('');
                setFpCode('');
                setFpNewData({ password: '', confirmPassword: '' });
            }, 1500);
        } catch (error: unknown) {
            const msg = (error as any).response?.data?.message || 'Failed to reset password. Code may be invalid or expired.';
            setErrorMsg(msg);
            toast.error(msg);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen p-4 bg-primary-bg text-text-primary">
            <div id="auth-container" className="w-full max-w-md">

                {/* Logo / Title */}
                <div id="logo-section" className="flex flex-col items-center mb-8">
                    <img
                        className="h-16 w-auto mb-3"
                        src="https://storage.googleapis.com/uxpilot-auth.appspot.com/c244930b5e-c86eca2aba4c3575fba4.png"
                        alt="PokerHub Logo"
                    />
                    <h1
                        className="text-accent-yellow text-3xl font-bold cursor-pointer"
                        onClick={() => router.push('/')}
                    >
                        PokerHub
                    </h1>
                </div>

                {/* Card Container */}
                <div id="auth-card" className="bg-card-bg p-8 rounded-2xl shadow-xl relative text-left">

                    {/* ========== LOGIN FORM ========== */}
                    {activeView === 'login' && (
                        <div className="wizard-step active animate-fadeIn">
                            <h2 className="text-2xl font-bold text-text-primary text-center mb-6">Welcome Back</h2>
                            <form onSubmit={handleLoginSubmit} className="space-y-6">
                                {/* Email */}
                                <div>
                                    <label className="block text-sm text-text-secondary mb-2">Email Address</label>
                                    <input
                                        type="email"
                                        placeholder="you@example.com"
                                        className="w-full bg-primary-bg text-text-primary border border-border-dark rounded-xl p-3 focus:outline-none focus:border-accent-yellow focus:ring-1 focus:ring-accent-yellow placeholder-text-secondary text-sm"
                                        value={loginData.email}
                                        onChange={e => setLoginData({ ...loginData, email: e.target.value })}
                                        required
                                        autoComplete="email"
                                    />
                                </div>
                                {/* Password */}
                                <div>
                                    <label className="block text-sm text-text-secondary mb-2">Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPass.login ? "text" : "password"}
                                            placeholder="••••••••"
                                            className="w-full bg-primary-bg text-text-primary border border-border-dark rounded-xl p-3 focus:outline-none focus:border-accent-yellow focus:ring-1 focus:ring-accent-yellow placeholder-text-secondary text-sm"
                                            value={loginData.password}
                                            onChange={e => setLoginData({ ...loginData, password: e.target.value })}
                                            required
                                            autoComplete="current-password"
                                        />
                                        <i
                                            className={`fa-solid ${showPass.login ? 'fa-eye-slash' : 'fa-eye'} cursor-pointer absolute right-4 top-3 text-text-secondary`}
                                            onClick={() => setShowPass({ ...showPass, login: !showPass.login })}
                                        ></i>
                                    </div>
                                </div>

                                {/* Forgot Password Link */}
                                <div className="flex justify-between items-center">
                                    <span
                                        className="text-accent-yellow text-xs hover:underline cursor-pointer"
                                        onClick={() => setActiveView('forgot')}
                                    >
                                        Forgot Password?
                                    </span>
                                </div>

                                {/* Global Error Message */}
                                {errorMsg && <p className="text-danger-red text-sm text-center">{errorMsg}</p>}

                                {/* Submit */}
                                <button type="submit" className="w-full bg-accent-green text-text-primary font-bold py-3 rounded-xl hover:brightness-110 hover:shadow-[0_0_15px_5px_rgba(28,139,76,0.4)] transition-all duration-200 text-sm uppercase tracking-wider">
                                    Login
                                </button>
                            </form>

                            <p className="text-sm text-text-secondary text-center mt-6">
                                Don't have an account?{' '}
                                <button
                                    className="text-accent-yellow font-semibold hover:underline"
                                    onClick={() => setActiveView('signup')}
                                >
                                    Sign Up
                                </button>
                            </p>
                        </div>
                    )}

                    {/* ========== SIGNUP FORM ========== */}
                    {activeView === 'signup' && (
                        <div className="wizard-step active animate-fadeIn">
                            <h2 className="text-2xl font-bold text-text-primary text-center mb-6">Create Account</h2>

                            {configLoading && <p className="text-center text-text-secondary">Loading configuration...</p>}

                            {!configLoading && authConfig && !authConfig.allowRegistration && (
                                <div className="text-center p-4 bg-red-900/20 border border-red-500 rounded-xl text-red-500">
                                    Registration is currently closed.
                                </div>
                            )}

                            {!configLoading && (!authConfig || authConfig.allowRegistration) && (
                                <form onSubmit={handleSubmit(onSignupSubmit)} className="space-y-6">
                                    {/* Username */}
                                    <div>
                                        <label className="block text-sm text-text-secondary mb-2">Username</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="Choose a username"
                                                className={`w-full bg-primary-bg text-text-primary border ${errors.username ? 'border-danger-red' : 'border-border-dark'} rounded-xl p-3 focus:outline-none focus:border-accent-yellow focus:ring-1 focus:ring-accent-yellow placeholder-text-secondary text-sm`}
                                                {...register("username")}
                                            />
                                            {errors.username && <p className="text-danger-red text-xs mt-1">{errors.username.message}</p>}
                                        </div>
                                    </div>
                                    {/* Email */}
                                    <div>
                                        <label className="block text-sm text-text-secondary mb-2">Email Address</label>
                                        <input
                                            type="email"
                                            placeholder="you@example.com"
                                            className={`w-full bg-primary-bg text-text-primary border ${errors.email ? 'border-danger-red' : 'border-border-dark'} rounded-xl p-3 focus:outline-none focus:border-accent-yellow focus:ring-1 focus:ring-accent-yellow placeholder-text-secondary text-sm`}
                                            {...register("email")}
                                        />
                                        {errors.email && <p className="text-danger-red text-xs mt-1">{errors.email.message}</p>}
                                    </div>
                                    {/* Password */}
                                    <div>
                                        <label className="block text-sm text-text-secondary mb-2">Password</label>
                                        <div className="relative">
                                            <input
                                                type={showPass.signup ? "text" : "password"}
                                                placeholder="Create a strong password"
                                                className={`w-full bg-primary-bg text-text-primary border ${errors.password ? 'border-danger-red' : 'border-border-dark'} rounded-xl p-3 focus:outline-none focus:border-accent-yellow focus:ring-1 focus:ring-accent-yellow placeholder-text-secondary text-sm`}
                                                {...register("password")}
                                            />
                                            <i
                                                className={`fa-solid ${showPass.signup ? 'fa-eye-slash' : 'fa-eye'} cursor-pointer absolute right-4 top-3 text-text-secondary`}
                                                onClick={() => setShowPass({ ...showPass, signup: !showPass.signup })}
                                            ></i>
                                        </div>
                                        {errors.password && <p className="text-danger-red text-xs mt-1">{errors.password.message}</p>}
                                    </div>

                                    {/* Confirm Password */}
                                    <div>
                                        <label className="block text-sm text-text-secondary mb-2">Confirm Password</label>
                                        <div className="relative">
                                            <input
                                                type={showPass.signupConfirm ? "text" : "password"}
                                                placeholder="Confirm your password"
                                                className={`w-full bg-primary-bg text-text-primary border ${errors.confirmPassword ? 'border-danger-red' : 'border-border-dark'} rounded-xl p-3 focus:outline-none focus:border-accent-yellow focus:ring-1 focus:ring-accent-yellow placeholder-text-secondary text-sm`}
                                                {...register("confirmPassword")}
                                            />
                                            <i
                                                className={`fa-solid ${showPass.signupConfirm ? 'fa-eye-slash' : 'fa-eye'} cursor-pointer absolute right-4 top-3 text-text-secondary`}
                                                onClick={() => setShowPass({ ...showPass, signupConfirm: !showPass.signupConfirm })}
                                            ></i>
                                        </div>
                                        {errors.confirmPassword && <p className="text-danger-red text-xs mt-1">{errors.confirmPassword.message}</p>}
                                    </div>

                                    {errorMsg && <p className="text-danger-red text-sm text-center">{errorMsg}</p>}
                                    {successMsg && <p className="text-accent-green text-sm text-center">{successMsg}</p>}

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full bg-accent-green text-text-primary font-bold py-3 rounded-xl hover:brightness-110 hover:shadow-[0_0_15px_5px_rgba(28,139,76,0.4)] transition-all duration-200 text-sm uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? 'Creating Account...' : 'Create Account'}
                                    </button>
                                </form>
                            )}

                            <p className="text-sm text-text-secondary text-center mt-6">
                                Already have an account?{' '}
                                <button
                                    className="text-accent-yellow font-semibold hover:underline"
                                    onClick={() => setActiveView('login')}
                                >
                                    Log In
                                </button>
                            </p>
                        </div>
                    )}

                    {/* ========== FORGOT PASSWORD WIZARD ========== */}
                    {activeView === 'forgot' && (
                        <div className="wizard-step active animate-fadeIn">
                            <h2 className="text-2xl font-bold text-text-primary text-center mb-6">Reset Password</h2>

                            {/* Step 1: Request Code */}
                            {forgotStep === 1 && (
                                <form onSubmit={handleFpStep1} className="space-y-6">
                                    <div>
                                        <label className="block text-sm text-text-secondary mb-2">Email Address</label>
                                        <input
                                            type="email"
                                            placeholder="you@example.com"
                                            className="w-full bg-primary-bg text-text-primary border border-border-dark rounded-xl p-3 focus:outline-none focus:border-accent-yellow focus:ring-1 focus:ring-accent-yellow placeholder-text-secondary text-sm"
                                            value={fpEmail}
                                            onChange={e => setFpEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                    {errorMsg && <p className="text-danger-red text-sm text-center">{errorMsg}</p>}
                                    {successMsg && <p className="text-accent-green text-sm text-center">{successMsg}</p>}
                                    <button type="submit" className="w-full bg-accent-green text-text-primary font-bold py-3 rounded-xl hover:brightness-110 hover:shadow-[0_0_15px_5px_rgba(28,139,76,0.4)] transition-all duration-200 text-sm uppercase tracking-wider">
                                        Send Code
                                    </button>
                                </form>
                            )}

                            {/* Step 2: Verify Code */}
                            {forgotStep === 2 && (
                                <form onSubmit={handleFpStep2} className="space-y-6">
                                    <div>
                                        <label className="block text-sm text-text-secondary mb-2">Enter 6-digit Code</label>
                                        <input
                                            type="text"
                                            maxLength={6}
                                            placeholder="123456"
                                            className="w-full bg-primary-bg text-text-primary border border-border-dark rounded-xl p-3 focus:outline-none focus:border-accent-yellow focus:ring-1 focus:ring-accent-yellow placeholder-text-secondary text-sm"
                                            value={fpCode}
                                            onChange={e => setFpCode(e.target.value)}
                                            required
                                        />
                                    </div>
                                    {errorMsg && <p className="text-danger-red text-sm text-center">{errorMsg}</p>}
                                    {successMsg && <p className="text-accent-green text-sm text-center">{successMsg}</p>}
                                    <button type="submit" className="w-full bg-accent-green text-text-primary font-bold py-3 rounded-xl hover:brightness-110 hover:shadow-[0_0_15px_5px_rgba(28,139,76,0.4)] transition-all duration-200 text-sm uppercase tracking-wider">
                                        Verify Code
                                    </button>
                                </form>
                            )}

                            {/* Step 3: Reset Password */}
                            {forgotStep === 3 && (
                                <form onSubmit={handleFpStep3} className="space-y-6">
                                    <div>
                                        <label className="block text-sm text-text-secondary mb-2">New Password</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="New password"
                                                className="w-full bg-primary-bg text-text-primary border border-border-dark rounded-xl p-3 focus:outline-none focus:border-accent-yellow focus:ring-1 focus:ring-accent-yellow placeholder-text-secondary text-sm"
                                                value={fpNewData.password}
                                                onChange={e => setFpNewData({ ...fpNewData, password: e.target.value })}
                                                required
                                            />
                                            <i
                                                className={`fa-solid ${showPass.fpNew ? 'fa-eye-slash' : 'fa-eye'} cursor-pointer absolute right-4 top-3 text-text-secondary`}
                                                onClick={() => setShowPass({ ...showPass, fpNew: !showPass.fpNew })}
                                            ></i>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-text-secondary mb-2">Confirm Password</label>
                                        <div className="relative">
                                            <input
                                                type={(showPass as any).fpConfirm ? "text" : "password"}
                                                placeholder="Confirm password"
                                                className="w-full bg-primary-bg text-text-primary border border-border-dark rounded-xl p-3 focus:outline-none focus:border-accent-yellow focus:ring-1 focus:ring-accent-yellow placeholder-text-secondary text-sm"
                                                value={fpNewData.confirmPassword}
                                                onChange={e => setFpNewData({ ...fpNewData, confirmPassword: e.target.value })}
                                                required
                                            />
                                            <i
                                                className={`fa-solid ${(showPass as any).fpConfirm ? 'fa-eye-slash' : 'fa-eye'} cursor-pointer absolute right-4 top-3 text-text-secondary`}
                                                onClick={() => setShowPass({ ...showPass, fpConfirm: !showPass.fpConfirm })}
                                            ></i>
                                        </div>
                                    </div>
                                    {errorMsg && <p className="text-danger-red text-sm text-center">{errorMsg}</p>}
                                    {successMsg && <p className="text-accent-green text-sm text-center">{successMsg}</p>}
                                    <button type="submit" className="w-full bg-accent-green text-text-primary font-bold py-3 rounded-xl hover:brightness-110 hover:shadow-[0_0_15px_5px_rgba(28,139,76,0.4)] transition-all duration-200 text-sm uppercase tracking-wider">
                                        Reset Password
                                    </button>
                                </form>
                            )}

                            <p className="text-sm text-text-secondary text-center mt-6">
                                <button
                                    className="text-accent-yellow font-semibold hover:underline"
                                    onClick={() => { setActiveView('login'); setForgotStep(1); }}
                                >
                                    Back to Login
                                </button>
                            </p>
                        </div>
                    )}

                    {/* ========== SOCIAL LOGIN ========== */}
                    <div className="mt-8">
                        <div className="relative flex items-center py-3">
                            <div className="flex-grow border-t border-border-dark"></div>
                            <span className="mx-4 text-xs text-text-secondary uppercase">Or continue with</span>
                            <div className="flex-grow border-t border-border-dark"></div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                            <button className="flex items-center justify-center w-full bg-hover-bg text-text-primary font-medium py-3 px-4 rounded-xl hover:bg-border-dark transition-colors duration-200 text-sm">
                                <i className="fa-brands fa-google text-xl mr-3"></i> Google
                            </button>
                            <button className="flex items-center justify-center w-full bg-hover-bg text-text-primary font-medium py-3 px-4 rounded-xl hover:bg-border-dark transition-colors duration-200 text-sm">
                                <i className="fa-brands fa-facebook-f text-xl mr-3"></i> Facebook
                            </button>
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <footer className="text-center mt-8">
                    <p className="text-xs text-text-secondary">© 2024 PokerHub. All rights reserved.</p>
                    <div className="mt-2 space-x-4">
                        <span className="text-xs text-text-secondary hover:text-accent-yellow cursor-pointer">Terms of Service</span>
                        <span className="text-xs text-text-secondary hover:text-accent-yellow cursor-pointer">Privacy Policy</span>
                    </div>
                </footer>
            </div>

            {/* Injected CSS for animation if not present globally */}
            <style jsx global>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
}
