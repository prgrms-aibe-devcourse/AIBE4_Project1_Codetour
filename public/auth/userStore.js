import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "/libs/config.js";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const currentUser = {
  id: null,
  email: null,
  name: null,
  avatar_url: null,
};

export function setCurrentUser(user) {
  if (!user) {
    currentUser.id = null;
    currentUser.email = null;
    currentUser.name = null;
    currentUser.avatar_url = null;
    return;
  }
  currentUser.id = user.id || null;
  currentUser.email = user.email || null;
  currentUser.name =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    (user.email ? user.email.split("@")[0] : "") ||
    "";
  currentUser.avatar_url =
    user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
}

export function getSafeUserInfo() {
  return { ...currentUser };
}

(async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  setCurrentUser(user || null);
})();

supabase.auth.onAuthStateChange((_event, session) => {
  setCurrentUser(session?.user || null);
});

window.currentUser = currentUser;
window.getSafeUserInfo = getSafeUserInfo;
