"use client";

import { User } from "@/services/api/types/user";
import {
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AuthActionsContext,
  AuthContext,
  AuthTokensContext,
  TokensInfo,
} from "./auth-context";
import useFetch from "@/services/api/use-fetch";
import { AUTH_LOGOUT_URL, AUTH_ME_URL } from "@/services/api/config";
import HTTP_CODES_ENUM from "../api/types/http-codes";
import {
  getTokensInfo,
  setTokensInfo as setTokensInfoToStorage,
} from "./auth-tokens-info";
import { emitAuthEvent, onAuthEvent } from "./auth-events";
import queryClient from "@/services/react-query/query-client";

function AuthProvider(props: PropsWithChildren) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const fetchBase = useFetch();

  const setTokensInfo = useCallback((tokensInfo: TokensInfo) => {
    setTokensInfoToStorage(tokensInfo);

    if (tokensInfo) {
      emitAuthEvent({ type: "login" });
    } else {
      setUser(null);
      emitAuthEvent({ type: "logout" });
    }
  }, []);

  const logOut = useCallback(async () => {
    const tokens = getTokensInfo();

    try {
      if (tokens?.token) {
        await fetchBase(AUTH_LOGOUT_URL, {
          method: "POST",
        });
      }
    } finally {
      // Local auth state must be cleared even when the logout request fails
      // (offline, server down) — otherwise the user stays logged in.
      setTokensInfo(null);
    }
  }, [setTokensInfo, fetchBase]);

  const loadData = useCallback(async () => {
    const tokens = getTokensInfo();

    try {
      if (tokens?.token) {
        const response = await fetchBase(AUTH_ME_URL, {
          method: "GET",
        });

        if (response.status === HTTP_CODES_ENUM.UNAUTHORIZED) {
          logOut();
          return;
        }

        // Hanya 401 yang berarti token benar-benar basi. Status lain (502/503
        // saat service restart, 5xx, timeout) bersifat sementara: JANGAN parse
        // body-nya — isinya bukan User, dan `setUser(nonUser)` membuat
        // auth_guard memaksa redirect. `user` dibiarkan null supaya UI tetap
        // di state "memuat", dan cookie token tidak disentuh sehingga load
        // berikutnya memulihkan session tanpa user login ulang.
        if (!response.ok) {
          return;
        }

        const data = await response.json();
        setUser(data);
      }
    } finally {
      setIsLoaded(true);
    }
  }, [fetchBase, logOut]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    return onAuthEvent((event) => {
      if (event.type === "logout") {
        setUser(null);
        // Cached queries belong to the previous user; keeping them would
        // show that user's data to the next account on this machine.
        queryClient.clear();
      } else {
        loadData();
      }
    });
  }, [loadData]);

  const contextValue = useMemo(
    () => ({
      isLoaded,
      user,
    }),
    [isLoaded, user]
  );

  const contextActionsValue = useMemo(
    () => ({
      setUser,
      logOut,
    }),
    [logOut]
  );

  const contextTokensValue = useMemo(
    () => ({
      setTokensInfo,
    }),
    [setTokensInfo]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      <AuthActionsContext.Provider value={contextActionsValue}>
        <AuthTokensContext.Provider value={contextTokensValue}>
          {props.children}
        </AuthTokensContext.Provider>
      </AuthActionsContext.Provider>
    </AuthContext.Provider>
  );
}

export default AuthProvider;
