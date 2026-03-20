import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  DashboardLayout,
  Spinner,
  StatusBadge,
  Modal,
} from "../../components/common";
import { instructorAPI, courseAPI, quizAPI } from "../../api";
import {
  BookOpen,
  Plus,
  Users,
  BarChart2,
  Eye,
  Trash2,
  Send,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import toast from "react-hot-toast";

// ── Instructor Dashboard ──────────────────────────────────────────────────────
export const InstructorDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    instructorAPI
      .getDashboard()
      .then((r) => setData(r.data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <DashboardLayout title="Dashboard">
        <Spinner />
      </DashboardLayout>
    );
  const { stats, courses = [], recentSubmissions = [] } = data || {};

  return (
    <DashboardLayout title="Instructor Dashboard">
      <div style={{ marginBottom: 28 }}>
        <h1 className="page-title">Instructor Dashboard</h1>
        <p className="page-subtitle">Manage your courses and students</p>
      </div>

      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          {
            label: "Total Courses",
            value: stats?.totalCourses || 0,
            color: "var(--accent)",
          },
          {
            label: "Published",
            value: stats?.publishedCourses || 0,
            color: "var(--green)",
          },
          {
            label: "Total Enrollments",
            value: stats?.totalEnrollments || 0,
            color: "var(--gold)",
          },
          {
            label: "Avg Rating",
            value: stats?.avgRating || "—",
            color: "var(--coral)",
          },
        ].map(({ label, value, color }) => (
          <div className="stat-card" key={label}>
            <div className="stat-value" style={{ color }}>
              {value}
            </div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        <div className="card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <h3 style={{ fontFamily: "var(--font-serif)" }}>My Courses</h3>
            <Link to="/instructor/create" className="btn btn-primary btn-sm">
              <Plus size={14} />
              New
            </Link>
          </div>
          {courses.slice(0, 5).map((c) => (
            <div
              key={c._id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 0",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{c.title}</div>
                <div style={{ fontSize: 11, color: "var(--text2)" }}>
                  {c.enrollmentCount} enrolled
                </div>
              </div>
              <StatusBadge status={c.status} />
            </div>
          ))}
        </div>

        <div className="card">
          <h3 style={{ fontFamily: "var(--font-serif)", marginBottom: 16 }}>
            Recent Submissions
          </h3>
          {recentSubmissions.length === 0 ? (
            <p style={{ color: "var(--text3)", fontSize: 13 }}>
              No submissions yet.
            </p>
          ) : (
            recentSubmissions.slice(0, 6).map((s) => (
              <div
                key={s._id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 0",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>
                    {s.student?.name}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text2)" }}>
                    {s.quiz?.title}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: s.passed ? "var(--green)" : "var(--red)",
                  }}
                >
                  {s.percentage}%
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

// ── My Courses List ────────────────────────────────────────────────────────────
export const InstructorCoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchCourses = () => {
    setLoading(true);
    courseAPI
      .getMyCourses()
      .then((r) => setCourses(r.data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleSubmit = async (id) => {
    try {
      await courseAPI.submit(id);
      toast.success("Submitted for review!");
      fetchCourses();
    } catch {}
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this course?")) return;
    try {
      await courseAPI.delete(id);
      toast.success("Course deleted");
      fetchCourses();
    } catch {}
  };

  return (
    <DashboardLayout title="My Courses">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <div>
          <h1 className="page-title">My Courses</h1>
          <p className="page-subtitle">Manage your course catalog</p>
        </div>
        <Link to="/instructor/create" className="btn btn-primary">
          <Plus size={16} />
          Create Course
        </Link>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Status</th>
                <th>Enrolled</th>
                <th>Lectures</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c._id}>
                  <td style={{ fontWeight: 500 }}>{c.title}</td>
                  <td>
                    <StatusBadge status={c.status} />
                  </td>
                  <td>{c.enrollmentCount}</td>
                  <td>{c.totalLectures || 0}</td>
                  <td>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => navigate(`/instructor/course/${c._id}`)}
                      >
                        <Eye size={13} />
                        Manage
                      </button>
                      {c.status === "draft" && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleSubmit(c._id)}
                        >
                          <Send size={13} />
                          Submit
                        </button>
                      )}
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(c._id)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {courses.length === 0 && (
            <div className="empty-state">
              <BookOpen size={48} />
              <p>No courses yet</p>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
};

// ── Create Course ──────────────────────────────────────────────────────────────
export const CreateCoursePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Programming",
    level: "beginner",
    language: "English",
    price: "0",
    tags: "",
    requirements: "",
    outcomes: "",
  });

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Submitting form:", form);

    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!form.description.trim()) {
      toast.error("Description is required");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        category: form.category,
        level: form.level,
        language: form.language,
        price: Number(form.price) || 0,
        tags: JSON.stringify(
          form.tags ? form.tags.split(",").map((s) => s.trim()) : [],
        ),
        requirements: JSON.stringify(
          form.requirements
            ? form.requirements.split(",").map((s) => s.trim())
            : [],
        ),
        outcomes: JSON.stringify(
          form.outcomes ? form.outcomes.split(",").map((s) => s.trim()) : [],
        ),
      };

      console.log("Sending payload:", payload);
      const res = await courseAPI.create(payload);
      console.log("Course created:", res.data);
      toast.success("Course created successfully!");
      navigate(`/instructor/course/${res.data.data._id}`);
    } catch (err) {
      console.error("Create course error:", err.response?.data || err.message);
      toast.error(err.response?.data?.message || "Failed to create course");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Create Course">
      <div style={{ maxWidth: 700 }}>
        <div style={{ marginBottom: 24 }}>
          <h1 className="page-title">Create New Course</h1>
          <p className="page-subtitle">Fill in the details below</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="card"
          style={{ display: "flex", flexDirection: "column", gap: 20 }}
        >
          <div className="form-group">
            <label className="form-label">Course Title *</label>
            <input
              className="form-input"
              placeholder="e.g. Complete JavaScript Course 2024"
              value={form.title}
              onChange={set("title")}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description *</label>
            <textarea
              className="form-input"
              rows={4}
              placeholder="What will students learn?"
              value={form.description}
              onChange={set("description")}
              required
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select
                className="form-input"
                value={form.category}
                onChange={set("category")}
                required
              >
                <option value="Programming">Programming</option>
                <option value="Design">Design</option>
                <option value="Business">Business</option>
                <option value="Data Science">Data Science</option>
                <option value="Marketing">Marketing</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Level *</label>
              <select
                className="form-input"
                value={form.level}
                onChange={set("level")}
                required
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Language</label>
              <input
                className="form-input"
                value={form.language}
                onChange={set("language")}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Price (₹ 0 = free)</label>
              <input
                className="form-input"
                type="number"
                min="0"
                value={form.price}
                onChange={set("price")}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Tags (comma separated)</label>
            <input
              className="form-input"
              placeholder="javascript, web dev, react"
              value={form.tags}
              onChange={set("tags")}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Requirements (comma separated)</label>
            <input
              className="form-input"
              placeholder="Basic computer knowledge, Internet"
              value={form.requirements}
              onChange={set("requirements")}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Learning Outcomes (comma separated)
            </label>
            <input
              className="form-input"
              placeholder="Build websites, Understand JS"
              value={form.outcomes}
              onChange={set("outcomes")}
            />
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button
              className="btn btn-primary"
              type="submit"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Course"}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => navigate("/instructor/courses")}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

// ── Manage Course (Add Modules/Lectures) ──────────────────────────────────────
export const ManageCoursePage = () => {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modTitle, setModTitle] = useState("");
  const [showLecModal, setShowLecModal] = useState(false);
  const [activeModId, setActiveModId] = useState(null);
  const [lecForm, setLecForm] = useState({
    title: "",
    description: "",
    isFree: false,
    videoUrl: "",
    videoType: "url",
  });
  const [videoFile, setVideoFile] = useState(null);

  const fetchCourse = () => {
    courseAPI
      .getOne(id)
      .then((r) => setCourse(r.data.data))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    fetchCourse();
  }, [id]);

  const addModule = async () => {
    if (!modTitle.trim()) return;
    try {
      await courseAPI.addModule(id, { title: modTitle });
      setModTitle("");
      fetchCourse();
      toast.success("Module added");
    } catch {}
  };

  const addLecture = async () => {
    if (!lecForm.title.trim()) {
      toast.error("Lecture title is required");
      return;
    }

    console.log("Sending lecture data:", {
      title: lecForm.title,
      description: lecForm.description,
      isFree: lecForm.isFree,
      videoUrl: lecForm.videoUrl,
      videoType: lecForm.videoType,
    });

    try {
      const payload = {
        title: lecForm.title.trim(),
        description: lecForm.description || "",
        isFree: lecForm.isFree || false,
        duration: 0,
        videoUrl: "",
      };

      // Add video URL based on type
      if (lecForm.videoType === "url" || !lecForm.videoType) {
        payload.videoUrl = lecForm.videoUrl || "";
      }

      console.log("Final payload:", payload);

      if (lecForm.videoType === "file" && videoFile) {
        // File upload
        const fd = new FormData();
        fd.append("title", payload.title);
        fd.append("description", payload.description);
        fd.append("isFree", payload.isFree ? "true" : "false");
        fd.append("duration", "0");
        fd.append("video", videoFile);
        await courseAPI.addLecture(id, activeModId, fd);
      } else {
        // JSON with URL
        await courseAPI.addLecture(id, activeModId, payload);
      }

      toast.success("Lecture added successfully!");
      setShowLecModal(false);
      setLecForm({
        title: "",
        description: "",
        isFree: false,
        videoUrl: "",
        videoType: "url",
      });
      setVideoFile(null);
      fetchCourse();
    } catch (err) {
      console.error("Lecture error:", err.response?.data || err.message);
      toast.error(err.response?.data?.message || "Failed to add lecture");
    }
  };

  if (loading)
    return (
      <DashboardLayout title="Manage Course">
        <Spinner />
      </DashboardLayout>
    );
  if (!course)
    return (
      <DashboardLayout title="Manage Course">
        <p>Not found</p>
      </DashboardLayout>
    );

  return (
    <DashboardLayout title={`Manage: ${course.title}`}>
      <div
        style={{
          marginBottom: 20,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h1 className="page-title">{course.title}</h1>
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <StatusBadge status={course.status} />
            <span className="badge badge-gray">
              {course.totalLectures} lectures
            </span>
          </div>
        </div>
      </div>

      {/* Add Module */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontFamily: "var(--font-serif)", marginBottom: 12 }}>
          Add Module
        </h3>
        <div style={{ display: "flex", gap: 10 }}>
          <input
            className="form-input"
            placeholder="Module title…"
            value={modTitle}
            onChange={(e) => setModTitle(e.target.value)}
            style={{ flex: 1 }}
          />
          <button className="btn btn-primary" onClick={addModule}>
            <Plus size={15} />
            Add Module
          </button>
        </div>
      </div>

      {/* Modules list */}
      {course.modules?.map((mod, mi) => (
        <div className="card" key={mi} style={{ marginBottom: 16 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <h3 style={{ fontFamily: "var(--font-serif)", fontSize: 15 }}>
              Module {mi + 1}: {mod.title}
            </h3>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setActiveModId(mod._id);
                  setShowLecModal(true);
                }}
              >
                <Plus size={13} /> Add Lecture
              </button>
              <button
                onClick={async () => {
                  if (
                    !window.confirm(
                      `Delete module "${mod.title}" and all its lectures?`,
                    )
                  )
                    return;
                  try {
                    await courseAPI.deleteModule(id, mod._id);
                    toast.success("Module deleted!");
                    fetchCourse();
                  } catch {
                    toast.error("Failed to delete module");
                  }
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 14px",
                  borderRadius: 8,
                  background: "rgba(244,63,94,0.1)",
                  border: "1px solid rgba(244,63,94,0.3)",
                  color: "#f43f5e",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(244,63,94,0.2)";
                  e.currentTarget.style.borderColor = "rgba(244,63,94,0.5)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(244,63,94,0.1)";
                  e.currentTarget.style.borderColor = "rgba(244,63,94,0.3)";
                }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
          {mod.lectures?.length === 0 && (
            <p style={{ color: "var(--text3)", fontSize: 13 }}>
              No lectures yet.
            </p>
          )}
          {mod.lectures?.map((lec, li) => (
            <div
              key={li}
              style={{
                padding: "12px 0",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {/* Lecture title */}
                <span
                  style={{
                    fontSize: 13,
                    flex: 1,
                    color: "var(--text)",
                    fontWeight: 500,
                  }}
                >
                  {lec.title}
                </span>

                {/* Badges */}
                {lec.isFree && (
                  <span className="badge badge-green" style={{ fontSize: 11 }}>
                    Free
                  </span>
                )}
                {lec.videoUrl && (
                  <span className="badge badge-blue" style={{ fontSize: 11 }}>
                    Video
                  </span>
                )}

                {/* Upload material button */}
                <label style={{ cursor: "pointer" }}>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx"
                    style={{ display: "none" }}
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      const fd = new FormData();
                      fd.append("file", file);
                      fd.append("name", file.name);
                      try {
                        await courseAPI.uploadMaterial(
                          id,
                          mod._id,
                          lec._id,
                          fd,
                        );
                        toast.success("Material uploaded!");
                        fetchCourse();
                      } catch {
                        toast.error("Upload failed");
                      }
                    }}
                  />
                  <span
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: 11 }}
                  >
                    + Material
                  </span>
                </label>

                {/* DELETE LECTURE BUTTON */}
                <button
                  onClick={async () => {
                    if (!window.confirm(`Delete "${lec.title}"?`)) return;
                    try {
                      await courseAPI.deleteLecture(id, mod._id, lec._id);
                      toast.success("Lecture deleted!");
                      fetchCourse();
                    } catch {
                      toast.error("Failed to delete");
                    }
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "5px 12px",
                    borderRadius: 6,
                    background: "rgba(244,63,94,0.08)",
                    border: "1px solid rgba(244,63,94,0.25)",
                    color: "#f43f5e",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "rgba(244,63,94,0.18)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "rgba(244,63,94,0.08)")
                  }
                >
                  <Trash2 size={11} />
                </button>
              </div>

              {/* Materials list */}
              {lec.materials?.length > 0 && (
                <div
                  style={{
                    paddingLeft: 20,
                    marginTop: 6,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                  }}
                >
                  {lec.materials.map((mat, mi) => (
                    <a
                      key={mi}
                      href={mat.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        fontSize: 11,
                        color: "var(--accent)",
                        background: "rgba(108,143,255,0.08)",
                        padding: "2px 8px",
                        borderRadius: 4,
                        textDecoration: "none",
                      }}
                    >
                      📄 {mat.name}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
      <Modal
        open={showLecModal}
        onClose={() => setShowLecModal(false)}
        title="Add Lecture"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Lecture Title *</label>
            <input
              className="form-input"
              placeholder="e.g. What is JavaScript?"
              value={lecForm.title}
              onChange={(e) =>
                setLecForm({ ...lecForm, title: e.target.value })
              }
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="What will students learn in this lecture?"
              value={lecForm.description}
              onChange={(e) =>
                setLecForm({ ...lecForm, description: e.target.value })
              }
            />
          </div>

          {/* Video options */}
          <div className="form-group">
            <label className="form-label">Video Option</label>
            <select
              className="form-input"
              value={lecForm.videoType || "url"}
              onChange={(e) =>
                setLecForm({ ...lecForm, videoType: e.target.value })
              }
            >
              <option value="url">Paste Video URL (YouTube/Drive/Any)</option>
              <option value="file">Upload Video File (mp4)</option>
              <option value="none">No Video</option>
            </select>
          </div>

          {/* Show URL input */}
          {(!lecForm.videoType || lecForm.videoType === "url") && (
            <div className="form-group">
              <label className="form-label">Video URL</label>
              <input
                className="form-input"
                placeholder="https://www.youtube.com/watch?v=... or direct mp4 URL"
                value={lecForm.videoUrl || ""}
                onChange={(e) => {
                  console.log("URL input changed:", e.target.value);
                  setLecForm({ ...lecForm, videoUrl: e.target.value });
                }}
              />
              <span
                style={{ fontSize: 11, color: "var(--text3)", marginTop: 4 }}
              >
                Paste any video URL here
              </span>
            </div>
          )}

          {/* Show file upload */}
          {lecForm.videoType === "file" && (
            <div className="form-group">
              <label className="form-label">Video File (mp4, mov)</label>
              <input
                type="file"
                accept="video/*"
                className="form-input"
                style={{ paddingTop: 8 }}
                onChange={(e) => setVideoFile(e.target.files[0])}
              />
            </div>
          )}

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={lecForm.isFree}
              onChange={(e) =>
                setLecForm({ ...lecForm, isFree: e.target.checked })
              }
              style={{ accentColor: "var(--accent)", width: 16, height: 16 }}
            />
            Free preview lecture (visible without enrollment)
          </label>

          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-primary" onClick={addLecture}>
              Add Lecture
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => setShowLecModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
};

// ── Quiz Management ───────────────────────────────────────────────────────────
export const InstructorQuizzesPage = () => {
  const [courses, setCourses] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [selCourse, setSelCourse] = useState("");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [quizForm, setQuizForm] = useState({
    title: "",
    courseId: "",
    description: "",
    durationMins: 30,
    passingMarks: 6,
    maxAttempts: 3,
  });
  const [questions, setQuestions] = useState([
    {
      questionText: "",
      type: "mcq",
      marks: 2,
      options: [
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
      ],
    },
  ]);

  useEffect(() => {
    courseAPI.getMyCourses().then((r) => setCourses(r.data.data || []));
  }, []);

  const fetchQuizzes = (cid) => {
    if (!cid) return;
    setLoading(true);
    quizAPI
      .getCourseQuizzes(cid)
      .then((r) => setQuizzes(r.data.data || []))
      .finally(() => setLoading(false));
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        questionText: "",
        type: "mcq",
        marks: 2,
        options: [
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
        ],
      },
    ]);
  };

  const removeQuestion = (qi) => {
    setQuestions(questions.filter((_, i) => i !== qi));
  };

  const updateQuestionText = (qi, val) => {
    const q = [...questions];
    q[qi].questionText = val;
    setQuestions(q);
  };

  const updateQuestionMarks = (qi, val) => {
    const q = [...questions];
    q[qi].marks = Number(val);
    setQuestions(q);
  };

  const updateOptionText = (qi, oi, val) => {
    const q = [...questions];
    q[qi].options[oi].text = val;
    setQuestions(q);
  };

  const setCorrectOption = (qi, oi) => {
    const q = [...questions];
    // Set all to false first
    q[qi].options = q[qi].options.map((opt, i) => ({
      ...opt,
      isCorrect: i === oi,
    }));
    setQuestions(q);
  };

  const createQuiz = async () => {
    if (!quizForm.title) {
      toast.error("Quiz title required");
      return;
    }
    if (!quizForm.courseId) {
      toast.error("Select a course");
      return;
    }

    // Validate all questions have correct answer selected
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].questionText.trim()) {
        toast.error(`Question ${i + 1} text is empty`);
        return;
      }
      const hasCorrect = questions[i].options.some((o) => o.isCorrect);
      if (!hasCorrect) {
        toast.error(`Question ${i + 1}: Please select the correct answer`);
        return;
      }
      const hasAllOptions = questions[i].options.every((o) => o.text.trim());
      if (!hasAllOptions) {
        toast.error(`Question ${i + 1}: Fill all option texts`);
        return;
      }
    }

    try {
      await quizAPI.create({ ...quizForm, questions });
      toast.success("Quiz created!");
      setShowModal(false);
      setQuizForm({
        title: "",
        courseId: "",
        description: "",
        durationMins: 30,
        passingMarks: 6,
        maxAttempts: 3,
      });
      setQuestions([
        {
          questionText: "",
          type: "mcq",
          marks: 2,
          options: [
            { text: "", isCorrect: false },
            { text: "", isCorrect: false },
            { text: "", isCorrect: false },
            { text: "", isCorrect: false },
          ],
        },
      ]);
      fetchQuizzes(quizForm.courseId);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create quiz");
    }
  };

  const togglePublish = async (id) => {
    try {
      await quizAPI.togglePublish(id);
      fetchQuizzes(selCourse);
      toast.success("Updated");
    } catch {}
  };

  const deleteQuiz = async (id) => {
    if (!window.confirm("Delete quiz?")) return;
    try {
      await quizAPI.delete(id);
      fetchQuizzes(selCourse);
      toast.success("Deleted");
    } catch {}
  };

  return (
    <DashboardLayout title="Quizzes">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <div>
          <h1 className="page-title">Quizzes</h1>
          <p className="page-subtitle">Create and manage assessments</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> New Quiz
        </button>
      </div>

      <select
        className="form-input"
        style={{ maxWidth: 300, marginBottom: 20 }}
        value={selCourse}
        onChange={(e) => {
          setSelCourse(e.target.value);
          fetchQuizzes(e.target.value);
        }}
      >
        <option value="">Select course to view quizzes</option>
        {courses.map((c) => (
          <option key={c._id} value={c._id}>
            {c.title}
          </option>
        ))}
      </select>

      {loading ? (
        <Spinner />
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Quiz Title</th>
                <th>Total Marks</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {quizzes.map((q) => (
                <tr key={q._id}>
                  <td style={{ fontWeight: 500 }}>{q.title}</td>
                  <td>{q.totalMarks}</td>
                  <td>{q.durationMins} min</td>
                  <td>
                    <span
                      className={`badge ${q.isPublished ? "badge-green" : "badge-gray"}`}
                    >
                      {q.isPublished ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => togglePublish(q._id)}
                      >
                        {q.isPublished ? "Unpublish" : "Publish"}
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => deleteQuiz(q._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && quizzes.length === 0 && selCourse && (
            <div className="empty-state">
              <p>No quizzes for this course</p>
            </div>
          )}
        </div>
      )}

      {/* Create Quiz Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Create New Quiz"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Quiz basic info */}
          <div className="form-group">
            <label className="form-label">Quiz Title *</label>
            <input
              className="form-input"
              placeholder="e.g. JavaScript Basics Quiz"
              value={quizForm.title}
              onChange={(e) =>
                setQuizForm({ ...quizForm, title: e.target.value })
              }
            />
          </div>

          <div className="form-group">
            <label className="form-label">Course *</label>
            <select
              className="form-input"
              value={quizForm.courseId}
              onChange={(e) =>
                setQuizForm({ ...quizForm, courseId: e.target.value })
              }
            >
              <option value="">Select course</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 12,
            }}
          >
            <div className="form-group">
              <label className="form-label">Duration (min)</label>
              <input
                className="form-input"
                type="number"
                value={quizForm.durationMins}
                onChange={(e) =>
                  setQuizForm({
                    ...quizForm,
                    durationMins: Number(e.target.value),
                  })
                }
              />
            </div>
            <div className="form-group">
              <label className="form-label">Passing Marks</label>
              <input
                className="form-input"
                type="number"
                value={quizForm.passingMarks}
                onChange={(e) =>
                  setQuizForm({
                    ...quizForm,
                    passingMarks: Number(e.target.value),
                  })
                }
              />
            </div>
            <div className="form-group">
              <label className="form-label">Max Attempts</label>
              <input
                className="form-input"
                type="number"
                value={quizForm.maxAttempts}
                onChange={(e) =>
                  setQuizForm({
                    ...quizForm,
                    maxAttempts: Number(e.target.value),
                  })
                }
              />
            </div>
          </div>

          {/* Questions */}
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <span style={{ fontWeight: 600, fontSize: 15 }}>
                Questions ({questions.length})
              </span>
              <button className="btn btn-ghost btn-sm" onClick={addQuestion}>
                <Plus size={13} /> Add Question
              </button>
            </div>

            {questions.map((q, qi) => (
              <div
                key={qi}
                style={{
                  background: "var(--bg3)",
                  borderRadius: "var(--radius)",
                  padding: 16,
                  marginBottom: 16,
                  border: "1px solid var(--border)",
                }}
              >
                {/* Question header */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 10,
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--accent)",
                    }}
                  >
                    Question {qi + 1}
                  </span>
                  {questions.length > 1 && (
                    <button
                      onClick={() => removeQuestion(qi)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--red)",
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>

                {/* Question text */}
                <input
                  className="form-input"
                  placeholder={`Enter question ${qi + 1} here...`}
                  value={q.questionText}
                  onChange={(e) => updateQuestionText(qi, e.target.value)}
                  style={{ marginBottom: 12 }}
                />

                {/* Options */}
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--text2)",
                    marginBottom: 8,
                  }}
                >
                  Click the circle to mark the correct answer ✓
                </p>

                {q.options.map((opt, oi) => (
                  <div
                    key={oi}
                    style={{
                      display: "flex",
                      gap: 10,
                      marginBottom: 8,
                      alignItems: "center",
                    }}
                  >
                    {/* Correct answer selector */}
                    <button
                      onClick={() => setCorrectOption(qi, oi)}
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        border: `2px solid ${opt.isCorrect ? "var(--green)" : "var(--border2)"}`,
                        background: opt.isCorrect
                          ? "var(--green)"
                          : "transparent",
                        cursor: "pointer",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontSize: 14,
                      }}
                    >
                      {opt.isCorrect ? "✓" : ""}
                    </button>

                    {/* Option text */}
                    <input
                      className="form-input"
                      placeholder={`Option ${oi + 1} — e.g. ${["var", "let", "int", "dim"][oi]}`}
                      value={opt.text}
                      onChange={(e) => updateOptionText(qi, oi, e.target.value)}
                      style={{
                        flex: 1,
                        borderColor: opt.isCorrect
                          ? "var(--green)"
                          : "var(--border)",
                      }}
                    />

                    {/* Correct label */}
                    {opt.isCorrect && (
                      <span
                        style={{
                          fontSize: 11,
                          color: "var(--green)",
                          minWidth: 50,
                          fontWeight: 600,
                        }}
                      >
                        ✓ Correct
                      </span>
                    )}
                  </div>
                ))}

                {/* Marks */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginTop: 10,
                  }}
                >
                  <label style={{ fontSize: 12, color: "var(--text2)" }}>
                    Marks for this question:
                  </label>
                  <input
                    className="form-input"
                    type="number"
                    min="1"
                    value={q.marks}
                    onChange={(e) => updateQuestionMarks(qi, e.target.value)}
                    style={{ width: 70 }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-primary" onClick={createQuiz}>
              Create Quiz
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
};
// ── Students Overview ──────────────────────────────────────────────────────────
export const InstructorStudentsPage = () => {
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selCourse, setSelCourse] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    courseAPI.getMyCourses().then((r) => setCourses(r.data.data));
  }, []);

  const fetchStudents = (cid) => {
    if (!cid) return;
    setLoading(true);
    instructorAPI
      .getCourseStudents(cid)
      .then((r) => setStudents(r.data.data))
      .finally(() => setLoading(false));
  };

  return (
    <DashboardLayout title="Students">
      <div style={{ marginBottom: 24 }}>
        <h1 className="page-title">Student Performance</h1>
        <p className="page-subtitle">
          View enrolled students and their progress
        </p>
      </div>

      <select
        className="form-input"
        style={{ maxWidth: 340, marginBottom: 20 }}
        value={selCourse}
        onChange={(e) => {
          setSelCourse(e.target.value);
          fetchStudents(e.target.value);
        }}
      >
        <option value="">Select a course</option>
        {courses.map((c) => (
          <option key={c._id} value={c._id}>
            {c.title}
          </option>
        ))}
      </select>

      {loading ? (
        <Spinner />
      ) : students.length > 0 ? (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Progress</th>
                <th>Status</th>
                <th>Enrolled</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s._id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{s.student?.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text2)" }}>
                      {s.student?.email}
                    </div>
                  </td>
                  <td style={{ width: 200 }}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <div className="progress-bar" style={{ flex: 1 }}>
                        <div
                          className="progress-fill green"
                          style={{ width: `${s.progressPercent}%` }}
                        />
                      </div>
                      <span style={{ fontSize: 12, minWidth: 30 }}>
                        {s.progressPercent}%
                      </span>
                    </div>
                  </td>
                  <td>
                    <StatusBadge status={s.status} />
                  </td>
                  <td style={{ fontSize: 13, color: "var(--text2)" }}>
                    {new Date(s.enrolledAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : selCourse ? (
        <div className="empty-state">
          <Users size={48} />
          <p>No students enrolled yet</p>
        </div>
      ) : null}
    </DashboardLayout>
  );
};
