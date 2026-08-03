"use client";

import * as React from "react";
import { useState, useId, useEffect } from "react";
import { Slot } from "@radix-ui/react-slot";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";
import { Eye, EyeOff, Volume2, VolumeX, Loader2, AlertCircle, CheckCircle2, UserPlus, LogIn, Mail, Building2 } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface TypewriterProps {
  text: string | string[];
  speed?: number;
  cursor?: string;
  loop?: boolean;
  deleteSpeed?: number;
  delay?: number;
  className?: string;
}

export function Typewriter({
  text,
  speed = 100,
  cursor = "|",
  loop = false,
  deleteSpeed = 50,
  delay = 1500,
  className,
}: TypewriterProps) {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [textArrayIndex, setTextArrayIndex] = useState(0);

  const textArray = Array.isArray(text) ? text : [text];
  const currentText = textArray[textArrayIndex] || "";

  useEffect(() => {
    if (!currentText) return;

    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          if (currentIndex < currentText.length) {
            setDisplayText((prev) => prev + currentText[currentIndex]);
            setCurrentIndex((prev) => prev + 1);
          } else if (loop) {
            setTimeout(() => setIsDeleting(true), delay);
          }
        } else {
          if (displayText.length > 0) {
            setDisplayText((prev) => prev.slice(0, -1));
          } else {
            setIsDeleting(false);
            setCurrentIndex(0);
            setTextArrayIndex((prev) => (prev + 1) % textArray.length);
          }
        }
      },
      isDeleting ? deleteSpeed : speed,
    );

    return () => clearTimeout(timeout);
  }, [
    currentIndex,
    isDeleting,
    currentText,
    loop,
    speed,
    deleteSpeed,
    delay,
    displayText,
    text,
  ]);

  return (
    <span className={className}>
      {displayText}
      <span className="animate-pulse">{cursor}</span>
    </span>
  );
}

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
);

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input dark:border-input/50 bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary-foreground/60 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-12 rounded-md px-6",
        icon: "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border border-input dark:border-input/50 bg-background px-3 py-3 text-sm text-foreground shadow-sm shadow-black/5 transition-shadow placeholder:text-muted-foreground/70 focus-visible:bg-accent focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}
const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, label, ...props }, ref) => {
    const id = useId();
    const [showPassword, setShowPassword] = useState(false);
    const togglePasswordVisibility = () => setShowPassword((prev) => !prev);
    return (
      <div className="grid w-full items-center gap-2">
        {label && <Label htmlFor={id}>{label}</Label>}
        <div className="relative">
          <Input id={id} type={showPassword ? "text" : "password"} className={cn("pe-10", className)} ref={ref} {...props} />
          <button type="button" onClick={togglePasswordVisibility} className="absolute inset-y-0 end-0 flex h-full w-10 items-center justify-center text-muted-foreground/80 transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50" aria-label={showPassword ? "Hide password" : "Show password"}>
            {showPassword ? (<EyeOff className="size-4" aria-hidden="true" />) : (<Eye className="size-4" aria-hidden="true" />)}
          </button>
        </div>
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";

interface FormProps {
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
  usernameValue?: string;
  passwordValue?: string;
  roleValue?: string;
  onUsernameChange?: (val: string) => void;
  onPasswordChange?: (val: string) => void;
  onRoleChange?: (val: string) => void;
  loading?: boolean;
}

function SignInForm({ onSubmit, usernameValue, passwordValue, roleValue, onUsernameChange, onPasswordChange, onRoleChange, loading }: FormProps) {
  const handleSignIn = (event: React.FormEvent<HTMLFormElement>) => { 
    event.preventDefault(); 
    if (onSubmit) {
      onSubmit(event);
    } else {
      console.log("UI: Sign In form submitted");
    }
  };
  return (
    <form onSubmit={handleSignIn} autoComplete="on" className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-1.5 text-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <LogIn className="w-6 h-6 text-orange-500" />
          <span>Sign in to IRSARGO</span>
        </h1>
        <p className="text-balance text-xs text-muted-foreground">Enter your Keycloak identity credentials below</p>
      </div>
      <div className="grid gap-3.5">
        <div className="grid gap-1.5">
          <Label htmlFor="username" className="text-xs">Username / Email</Label>
          <Input 
            id="username" 
            name="username" 
            type="text" 
            placeholder="e.g. isro_admin or isro_operator" 
            required 
            autoComplete="username" 
            value={usernameValue}
            onChange={(e) => onUsernameChange && onUsernameChange(e.target.value)}
          />
        </div>
        <PasswordInput 
          name="password" 
          label="Password" 
          required 
          autoComplete="current-password" 
          placeholder="Password" 
          value={passwordValue}
          onChange={(e) => onPasswordChange && onPasswordChange(e.target.value)}
        />
        <div className="grid gap-1.5">
          <Label htmlFor="userType" className="text-xs">User Type / Clearance Level</Label>
          <select
            id="userType"
            value={roleValue || 'Administrator'}
            onChange={(e) => onRoleChange && onRoleChange(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer font-mono"
          >
            <option value="Administrator">🏛️ Administrator (Level 5 — Top Secret)</option>
            <option value="Operator">🛰️ Operator (Level 3 — Confidential)</option>
            <option value="Researcher">🔬 Research Officer (Level 2 — Internal RAG)</option>
          </select>
        </div>
        <Button 
          type="submit" 
          disabled={loading}
          className="mt-1 font-bold cursor-pointer h-10 bg-orange-600 hover:bg-orange-500 text-white flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(234,88,12,0.3)]"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Authenticating...</span>
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              <span>Sign In via Keycloak</span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

function SignUpForm({ onSubmit, usernameValue, passwordValue, roleValue, onUsernameChange, onPasswordChange, onRoleChange, loading }: FormProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('Space Applications Centre (SAC)');

  const handleSignUp = (event: React.FormEvent<HTMLFormElement>) => { 
    event.preventDefault(); 
    if (onSubmit) {
      onSubmit(event);
    } else {
      console.log("UI: Sign Up form submitted");
    }
  };
  return (
    <form onSubmit={handleSignUp} autoComplete="on" className="flex flex-col gap-3.5">
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <UserPlus className="w-6 h-6 text-orange-500" />
          <span>Create Keycloak Account</span>
        </h1>
        <p className="text-balance text-xs text-muted-foreground">Register your ISRO identity in Keycloak Realm</p>
      </div>
      <div className="grid gap-2.5">
        <div className="grid gap-1">
          <Label htmlFor="name" className="text-xs">Full Name</Label>
          <Input 
            id="name" 
            name="name" 
            type="text" 
            placeholder="Dr. Vikram Sarabhai" 
            required 
            autoComplete="name" 
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="email" className="text-xs">ISRO Email Address</Label>
          <div className="relative">
            <Input 
              id="email" 
              name="email" 
              type="email" 
              placeholder="v.sarabhai@isro.gov.in" 
              required 
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="ps-9"
            />
            <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
          </div>
        </div>
        <div className="grid gap-1">
          <Label htmlFor="username" className="text-xs">Keycloak Username</Label>
          <Input 
            id="username" 
            name="username" 
            type="text" 
            placeholder="e.g. isro_admin or isro_user" 
            required 
            autoComplete="username" 
            value={usernameValue}
            onChange={(e) => onUsernameChange && onUsernameChange(e.target.value)}
          />
        </div>
        <PasswordInput 
          name="password" 
          label="Password" 
          required 
          autoComplete="new-password" 
          placeholder="Password"
          value={passwordValue}
          onChange={(e) => onPasswordChange && onPasswordChange(e.target.value)}
        />
        <div className="grid gap-1">
          <Label htmlFor="signupUserType" className="text-xs">User Type / Clearance Level</Label>
          <select
            id="signupUserType"
            name="signupUserType"
            value={roleValue || 'Operator'}
            onChange={(e) => onRoleChange && onRoleChange(e.target.value)}
            className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer font-mono"
          >
            <option value="Administrator">🏛️ Administrator (Level 5 — Top Secret)</option>
            <option value="Operator">🛰️ Operator (Level 3 — Confidential)</option>
            <option value="Researcher">🔬 Research Officer (Level 2 — Internal RAG)</option>
          </select>
        </div>
        <div className="grid gap-1">
          <Label htmlFor="department" className="text-xs">ISRO Center / Department</Label>
          <select
            id="department"
            name="department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer font-mono"
          >
            <option value="Space Applications Centre (SAC)">Space Applications Centre (SAC)</option>
            <option value="UR Rao Satellite Centre (URSC)">UR Rao Satellite Centre (URSC)</option>
            <option value="Vikram Sarabhai Space Centre (VSSC)">Vikram Sarabhai Space Centre (VSSC)</option>
            <option value="ISTRAC Command Network">ISTRAC Command Network</option>
            <option value="National Remote Sensing Centre (NRSC)">National Remote Sensing Centre (NRSC)</option>
          </select>
        </div>
        <Button 
          type="submit" 
          disabled={loading}
          className="mt-1 font-bold cursor-pointer h-10 bg-orange-600 hover:bg-orange-500 text-white flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(234,88,12,0.3)]"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Provisioning in Keycloak...</span>
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              <span>Register Identity in Keycloak</span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

function AuthFormContainer({ 
  isSignIn, 
  onToggle,
  onSubmit,
  usernameValue,
  passwordValue,
  roleValue,
  onUsernameChange,
  onPasswordChange,
  onRoleChange,
  onGoogleClick,
  error,
  successMessage,
  loading
}: { 
  isSignIn: boolean; 
  onToggle: () => void; 
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
  usernameValue?: string;
  passwordValue?: string;
  roleValue?: string;
  onUsernameChange?: (val: string) => void;
  onPasswordChange?: (val: string) => void;
  onRoleChange?: (val: string) => void;
  onGoogleClick?: () => void;
  error?: string | null;
  successMessage?: string | null;
  loading?: boolean;
}) {
    return (
        <div className="mx-auto grid w-[360px] gap-2.5">
            {/* Top Animated Tab Switcher */}
            <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1 mb-1 shadow-inner">
              <button
                type="button"
                onClick={() => { if (!isSignIn) onToggle(); }}
                className={cn(
                  "flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                  isSignIn ? "bg-orange-600 text-white shadow-md font-bold" : "text-zinc-400 hover:text-zinc-200"
                )}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => { if (isSignIn) onToggle(); }}
                className={cn(
                  "flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                  !isSignIn ? "bg-orange-600 text-white shadow-md font-bold" : "text-zinc-400 hover:text-zinc-200"
                )}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Sign Up</span>
              </button>
            </div>

            {/* Error / Success Notifications */}
            {error && (
              <div className="p-3 bg-red-950/80 border border-red-500/50 rounded-xl text-red-300 text-xs flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs flex items-start gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {isSignIn ? (
              <SignInForm 
                onSubmit={onSubmit}
                usernameValue={usernameValue}
                passwordValue={passwordValue}
                roleValue={roleValue}
                onUsernameChange={onUsernameChange}
                onPasswordChange={onPasswordChange}
                onRoleChange={onRoleChange}
                loading={loading}
              />
            ) : (
              <SignUpForm 
                onSubmit={onSubmit}
                usernameValue={usernameValue}
                passwordValue={passwordValue}
                roleValue={roleValue}
                onUsernameChange={onUsernameChange}
                onPasswordChange={onPasswordChange}
                onRoleChange={onRoleChange}
                loading={loading}
              />
            )}
            
            {/* Quick Test Persona Selector */}
            <div className="pt-2">
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider text-center mb-1.5">Quick Seed Test Personas:</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (onUsernameChange) onUsernameChange('isro_admin');
                    if (onPasswordChange) onPasswordChange('admin_password');
                  }}
                  className="px-2.5 py-1.5 bg-accent/40 hover:bg-accent border border-border rounded-lg text-left transition cursor-pointer"
                >
                  <p className="text-[10px] font-bold text-emerald-400 font-mono">isro_admin</p>
                  <p className="text-[8px] text-muted-foreground font-mono">Level 5 (Top Secret)</p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onUsernameChange) onUsernameChange('isro_operator');
                    if (onPasswordChange) onPasswordChange('operator_password');
                  }}
                  className="px-2.5 py-1.5 bg-accent/40 hover:bg-accent border border-border rounded-lg text-left transition cursor-pointer"
                >
                  <p className="text-[10px] font-bold text-blue-400 font-mono">isro_operator</p>
                  <p className="text-[8px] text-muted-foreground font-mono">Level 3 (Confidential)</p>
                </button>
              </div>
            </div>

            <div className="text-center text-sm pt-1">
                {isSignIn ? "Don't have a Keycloak account?" : "Already registered in Keycloak?"}{" "}
                <Button variant="link" className="pl-1 text-orange-400 font-bold hover:text-orange-300" onClick={onToggle}>
                    {isSignIn ? "Create Keycloak Account" : "Sign In via Keycloak"}
                </Button>
            </div>
        </div>
    )
}

interface AuthContentProps {
    image?: {
        src: string;
        alt: string;
    };
    video?: string;
    quote?: {
        text: string;
        author: string;
    }
}

export interface AuthUIProps {
    signInContent?: AuthContentProps;
    signUpContent?: AuthContentProps;
    onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
    onSignInSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
    onSignUpSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
    usernameValue?: string;
    passwordValue?: string;
    roleValue?: string;
    onUsernameChange?: (val: string) => void;
    onPasswordChange?: (val: string) => void;
    onRoleChange?: (val: string) => void;
    onGoogleClick?: () => void;
    error?: string | null;
    successMessage?: string | null;
    loading?: boolean;
}

const defaultSignInContent = {
    image: {
        src: "https://i.ibb.co/XrkdGrrv/original-ccdd6d6195fff2386a31b684b7abdd2e-removebg-preview.png",
        alt: "A beautiful interior design for sign-in"
    },
    video: "/Login.mp4",
    quote: {
        text: "IRSARGO: Secure Space Knowledge & Governance Assistant",
        author: "ISRO Governance Node"
    }
};

const defaultSignUpContent = {
    image: {
        src: "https://i.ibb.co/HTZ6DPsS/original-33b8479c324a5448d6145b3cad7c51e7-removebg-preview.png",
        alt: "A vibrant, modern space for new beginnings"
    },
    video: "/Login.mp4",
    quote: {
        text: "Authenticate PKI credentials to access confidential ISRO archives.",
        author: "ISRO Cryptographic Gateway"
    }
};

export interface AuthVideoPanelProps {
  video?: string;
  image?: { src: string; alt?: string };
  quote?: { text: string; author: string };
  className?: string;
}

export function AuthVideoPanel({
  video = "/Login.mp4",
  image,
  quote = {
    text: "IRSARGO: Secure Space Knowledge & Governance Assistant",
    author: "ISRO Space Applications Centre"
  },
  className = ""
}: AuthVideoPanelProps) {
  const [isMuted, setIsMuted] = useState(true);

  return (
    <div
      className={`hidden md:flex relative overflow-hidden bg-black min-h-[520px] flex-col justify-end p-6 ${className}`}
      key={video || image?.src}
    >
      {video ? (
        <video
          src={video}
          autoPlay
          loop
          muted={isMuted}
          playsInline
          className="absolute inset-0 w-full h-full object-cover scale-105"
        />
      ) : (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: image?.src ? `url(${image.src})` : undefined }}
        />
      )}

      <div className="absolute inset-0 bg-black/40 backdrop-blur-[0.5px]" />
      <div className="absolute inset-x-0 bottom-0 h-[180px] bg-gradient-to-t from-black via-black/70 to-transparent" />
      
      {video && (
        <button
          type="button"
          onClick={() => setIsMuted((prev) => !prev)}
          className="absolute top-6 right-6 z-20 p-2.5 rounded-full bg-black/60 border border-white/20 text-white hover:bg-black/80 transition-all backdrop-blur-md cursor-pointer"
          title={isMuted ? "Unmute audio" : "Mute audio"}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-orange-400 animate-pulse" />}
        </button>
      )}

      <div className="relative z-10 flex flex-col items-center text-center">
        <blockquote className="space-y-2 text-center text-foreground max-w-md bg-black/80 p-5 rounded-2xl border border-white/10 backdrop-blur-md shadow-2xl">
          <p className="text-sm font-medium text-white">
            “<Typewriter
                key={quote.text}
                text={quote.text}
                speed={60}
              />”
          </p>
          <cite className="block text-xs font-mono text-orange-400 not-italic mt-1">
              — {quote.author}
          </cite>
        </blockquote>
      </div>
    </div>
  );
}

export function AuthUI({ 
  signInContent = {}, 
  signUpContent = {},
  onSubmit,
  onSignInSubmit,
  onSignUpSubmit,
  usernameValue,
  passwordValue,
  roleValue,
  onUsernameChange,
  onPasswordChange,
  onRoleChange,
  onGoogleClick,
  error,
  successMessage,
  loading
}: AuthUIProps) {
  const [isSignIn, setIsSignIn] = useState(true);
  const toggleForm = () => setIsSignIn((prev) => !prev);

  const finalSignInContent = {
      image: { ...defaultSignInContent.image, ...signInContent.image },
      video: signInContent.video !== undefined ? signInContent.video : defaultSignInContent.video,
      quote: { ...defaultSignInContent.quote, ...signInContent.quote },
  };
  const finalSignUpContent = {
      image: { ...defaultSignUpContent.image, ...signUpContent.image },
      video: signUpContent.video !== undefined ? signUpContent.video : defaultSignUpContent.video,
      quote: { ...defaultSignUpContent.quote, ...signUpContent.quote },
  };

  const currentContent = isSignIn ? finalSignInContent : finalSignUpContent;
  const activeSubmitHandler = isSignIn ? (onSignInSubmit || onSubmit) : (onSignUpSubmit || onSubmit);

  return (
    <div className="w-full max-w-5xl bg-zinc-950 rounded-3xl border border-zinc-800/90 shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 relative z-10 my-auto">
      <style>{`
        input[type="password"]::-ms-reveal,
        input[type="password"]::-ms-clear {
          display: none;
        }
      `}</style>
      <div className="flex items-center justify-center p-6 md:p-8 bg-zinc-950">
        <AuthFormContainer 
          isSignIn={isSignIn} 
          onToggle={toggleForm} 
          onSubmit={activeSubmitHandler}
          usernameValue={usernameValue}
          passwordValue={passwordValue}
          roleValue={roleValue}
          onUsernameChange={onUsernameChange}
          onPasswordChange={onPasswordChange}
          onRoleChange={onRoleChange}
          onGoogleClick={onGoogleClick}
          error={error}
          successMessage={successMessage}
          loading={loading}
        />
      </div>

      <AuthVideoPanel 
        video={currentContent.video}
        image={currentContent.image}
        quote={currentContent.quote}
      />
    </div>
  );
}
