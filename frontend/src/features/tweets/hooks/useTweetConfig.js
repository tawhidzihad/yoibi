"use client";

import { useState, useEffect } from "react";
import { tweetsApi } from "../api/tweetsApi";

let cachedConfig = null;
let pendingPromise = null;

export async function fetchTweetConfig() {
    if (cachedConfig) return cachedConfig;
    if (pendingPromise) return pendingPromise;
    pendingPromise = tweetsApi
        .getTweetConfig()
        .then((res) => {
            if (res?.success && res?.data?.maxLength) {
                cachedConfig = res.data;
            }
            pendingPromise = null;
            return cachedConfig;
        })
        .catch(() => {
            pendingPromise = null;
            return null;
        });
    return pendingPromise;
}

export function useTweetConfig() {
    const [config, setConfig] = useState(cachedConfig);
    const [loading, setLoading] = useState(!cachedConfig);

    useEffect(() => {
        if (cachedConfig) {
            return;
        }
        let mounted = true;
        fetchTweetConfig().then((cfg) => {
            if (mounted) {
                if (cfg) setConfig(cfg);
                setLoading(false);
            }
        });
        return () => {
            mounted = false;
        };
    }, []);

    return {
        maxLength: config?.maxLength ?? null,
        loading,
    };
}
