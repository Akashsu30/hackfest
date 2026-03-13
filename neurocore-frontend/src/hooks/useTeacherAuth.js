import { useState, useEffect, useCallback } from "react";

const API = "http://localhost:5000";

const useTeacherAuth = () => {
  const [teacher, setTeacher] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("neurocore_teacher_token");
    const savedTeacher = localStorage.getItem("neurocore_teacher");
    if (savedToken && savedTeacher) {
      setToken(savedToken);
      setTeacher(JSON.parse(savedTeacher));
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await fetch(`${API}/api/teachers/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    localStorage.setItem("neurocore_teacher_token", data.token);
    localStorage.setItem("neurocore_teacher", JSON.stringify(data.teacher));
    setToken(data.token);
    setTeacher(data.teacher);
    return data;
  }, []);

  const register = useCallback(async (name, email, password, classroomName) => {
    const res = await fetch(`${API}/api/teachers/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, classroomName }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    localStorage.setItem("neurocore_teacher_token", data.token);
    localStorage.setItem("neurocore_teacher", JSON.stringify(data.teacher));
    setToken(data.token);
    setTeacher(data.teacher);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("neurocore_teacher_token");
    localStorage.removeItem("neurocore_teacher");
    setToken(null);
    setTeacher(null);
  }, []);

  const authFetch = useCallback(async (url, options = {}) => {
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
  }, [token]);

  return { teacher, token, loading, login, register, logout, authFetch };
};

export default useTeacherAuth;