import React, {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Models } from "appwrite";
import toast from "react-hot-toast";

import api from "../services/api";
import { SERVER } from "../lib/config";
import useLocalStorage from "../lib/hooks/useLocalStorage";
import useUpdateOnlineAt from "../lib/hooks/useUpdateOnlineAt";
import Loading from "../pages/Loading";
import { logUserOut } from "../services/sessionServices";
import { addUserToGlobalChat, createDetailsDoc } from "../services/registerUserService";
import { getCurrentUserDetails, updateUserDetails } from "../services/userDetailsService";
import { IUserDetails, UserPrefs } from "../types/interfaces";

const AUTH_ROUTES = ["/login", "/register"];

type AuthProviderProps = { children: ReactNode };

export interface IAuthContext {
  currentUser: Models.User<UserPrefs> | null;
  currentUserDetails: IUserDetails | null;
  isLoading: boolean;
  intended: string;
  setCurrentUser: React.Dispatch<React.SetStateAction<Models.User<UserPrefs> | null>>;
  setCurrentUserDetails: React.Dispatch<React.SetStateAction<IUserDetails | null>>;
  refreshUserDetails: () => Promise<void>;
  register: (credentials: { email: string; password: string; name: string }) => Promise<void>;
  logIn: (credentials: { email: string; password: string }) => Promise<void>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<IAuthContext | null>(null);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [currentUser, setCurrentUser] = useState<Models.User<UserPrefs> | null>(null);
  const [currentUserDetails, setCurrentUserDetails] = useState<IUserDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const intendedRef = useRef<string>("/");
  const [localUser, setLocalUser] = useLocalStorage<Models.User<UserPrefs> | null>("user", null);

  const isFetchingRef = useRef<boolean>(false); // لمنع race conditions

  useUpdateOnlineAt(currentUserDetails?.$id);

  // جلب الحساب الحالي
  const getAccount = useCallback(async (): Promise<Models.User<UserPrefs> | null> => {
    try {
      return (await api.getAccount()) as Models.User<UserPrefs>;
    } catch {
      return null;
    }
  }, []);

  // جلب تفاصيل المستخدم أو إنشائها إذا لم توجد
  const getUserDetailsSafe = useCallback(async (user: Models.User<UserPrefs>): Promise<IUserDetails> => {
    try {
      return await getCurrentUserDetails(user);
    } catch {
      return await createDetailsDoc(user);
    }
  }, []);

  // تحميل بيانات المستخدم عند بداية التشغيل
  const fetchUserDataOnLoad = useCallback(async () => {
    if (isFetchingRef.current) return; // منع race condition
    isFetchingRef.current = true;
    setIsLoading(true);

    try {
      let user: Models.User<UserPrefs> | null = localUser ?? (await getAccount());
      if (!user) throw new Error("Unable to fetch user account");

      const userDetails = await getUserDetailsSafe(user);

      // تحديث الاسم إذا كان null
      if (!user.name) {
        const newName = user.email.split("@")[0];
        user = await api.provider().account.updateName(newName);
        await updateUserDetails(userDetails.$id, { name: newName });
      }

      setCurrentUser(user);
      setCurrentUserDetails(userDetails);
      setLocalUser(user);

      // التنقل الآمن بعد التحميل
      const targetPath = AUTH_ROUTES.includes(intendedRef.current) ? "/chats" : intendedRef.current;
      navigate(targetPath, { replace: true });
    } catch (err: any) {
      navigate("/login", { replace: true });
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [getAccount, getUserDetailsSafe, localUser, navigate, setLocalUser]);

  // تسجيل مستخدم جديد
  const register = async (credentials: { email: string; password: string; name: string }) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setIsLoading(true);

    try {
      const user = await api.createAccount(credentials.email, credentials.password, credentials.name);
      await api.createSession(credentials.email, credentials.password);

      const userDetails = (await api.createDocument(SERVER.DATABASE_ID, SERVER.COLLECTION_ID_USERS, {
        userID: user.$id,
        name: user.name || credentials.name,
      })) as IUserDetails;

      await api.updatePrefs({ detailsDocID: userDetails.$id });
      await addUserToGlobalChat(userDetails.$id);

      setCurrentUser(user);
      setCurrentUserDetails(userDetails);
      setLocalUser(user);

      toast.success("Registration successful!");
      navigate("/chats", { replace: true });
    } catch (err: any) {
      toast.error(err.message || "Registration failed");
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  };

  // تسجيل دخول المستخدم
  const logIn = async (credentials: { email: string; password: string }) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setIsLoading(true);

    try {
      await api.createSession(credentials.email, credentials.password);
      await fetchUserDataOnLoad();
    } catch (err: any) {
      toast.error(err.message || "Login failed");
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  };

  // تسجيل خروج المستخدم
  const logOut = async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setIsLoading(true);

    try {
      setCurrentUser(null);
      setCurrentUserDetails(null);
      localStorage.clear();
      await logUserOut();
      navigate("/login", { replace: true });
    } catch (err: any) {
      toast.error(err.message || "Logout failed");
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  };

  // تحديث بيانات المستخدم
  const refreshUserDetails = async () => {
    if (!currentUser) return;
    try {
      const details = await getCurrentUserDetails(currentUser);
      setCurrentUserDetails(details);
    } catch {
      toast.error("Failed to refresh user details");
    }
  };

  // تحديث المسار المقصود
  useEffect(() => {
    intendedRef.current = pathname;
    if (!currentUser || !currentUserDetails) {
      fetchUserDataOnLoad();
    }
  }, [pathname, currentUser, currentUserDetails, fetchUserDataOnLoad]);

  if (isLoading) return <Loading />;

  const contextValue: IAuthContext = {
    currentUser,
    currentUserDetails,
    isLoading,
    intended: intendedRef.current,
    setCurrentUser,
    setCurrentUserDetails,
    refreshUserDetails,
    register,
    logIn,
    logOut,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

// Hook للاستخدام في المكونات
export const useAuth = (): IAuthContext => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

export default AuthContext;
