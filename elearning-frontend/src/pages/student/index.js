import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { DashboardLayout, Spinner, StatusBadge } from "../../components/common";
import { progressAPI, courseAPI, enrollAPI, quizAPI } from "../../api";
import {
  BookOpen,
  Award,
  TrendingUp,
  Play,
  CheckCircle,
  XCircle,
  Star,
  FileText,
} from "lucide-react";
import toast from "react-hot-toast";

const getYouTubeId = (url) => {
  if (!url) return "";
  if (url.includes("youtu.be/")) return url.split("youtu.be/")[1].split("?")[0];
  if (url.includes("youtube.com/watch")) {
    try {
      return new URLSearchParams(url.split("?")[1]).get("v") || "";
    } catch {
      return "";
    }
  }
  if (url.includes("youtube.com/embed/"))
    return url.split("embed/")[1].split("?")[0];
  return "";
};
const isYouTube = (url) =>
  !!(url && (url.includes("youtube.com") || url.includes("youtu.be")));

export const StudentDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    progressAPI
      .getDashboard()
      .then((r) => setData(r.data.data))
      .catch(() =>
        setData({
          stats: {},
          enrollments: [],
          recentQuizzes: [],
          certificates: [],
        }),
      )
      .finally(() => setLoading(false));
  }, []);
  if (loading)
    return (
      <DashboardLayout title="Dashboard">
        <Spinner />
      </DashboardLayout>
    );
  const {
    stats = {},
    enrollments = [],
    recentQuizzes = [],
    certificates = [],
  } = data || {};
  return (
    <DashboardLayout title="Student Dashboard">
      <div style={{ marginBottom: 28 }}>
        <h1 className="page-title">Welcome back</h1>
        <p className="page-subtitle">Track your learning progress</p>
      </div>
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          {
            label: "Enrolled",
            value: stats.totalEnrolled || 0,
            color: "var(--accent)",
            icon: BookOpen,
          },
          {
            label: "In Progress",
            value: stats.inProgress || 0,
            color: "var(--gold)",
            icon: TrendingUp,
          },
          {
            label: "Completed",
            value: stats.completed || 0,
            color: "var(--green)",
            icon: CheckCircle,
          },
          {
            label: "Certificates",
            value: stats.certificates || 0,
            color: "var(--coral)",
            icon: Award,
          },
        ].map(({ label, value, color, icon: Icon }) => (
          <div className="stat-card" key={label}>
            <Icon size={20} color={color} />
            <div className="stat-value" style={{ color }}>
              {value}
            </div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>
      <div className="grid-2">
        <div className="card">
          <h3 style={{ fontFamily: "var(--font-serif)", marginBottom: 16 }}>
            Active Courses
          </h3>
          {enrollments.filter((e) => e.status === "active").length === 0 ? (
            <p style={{ color: "var(--text3)", fontSize: 13 }}>
              No active courses.{" "}
              <Link to="/student/courses" style={{ color: "var(--accent)" }}>
                Browse courses
              </Link>
            </p>
          ) : (
            enrollments
              .filter((e) => e.status === "active")
              .slice(0, 4)
              .map((en) => (
                <Link
                  to={`/student/course/${en.course?._id}`}
                  key={en._id}
                  style={{
                    display: "block",
                    padding: "12px 0",
                    borderBottom: "1px solid var(--border)",
                    textDecoration: "none",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 6,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: "var(--text)",
                      }}
                    >
                      {en.course?.title}
                    </span>
                    <span style={{ fontSize: 12, color: "var(--text2)" }}>
                      {en.progressPercent}%
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${en.progressPercent}%` }}
                    />
                  </div>
                </Link>
              ))
          )}
        </div>
        <div className="card">
          <h3 style={{ fontFamily: "var(--font-serif)", marginBottom: 16 }}>
            Recent Quiz Results
          </h3>
          {recentQuizzes.length === 0 ? (
            <p style={{ color: "var(--text3)", fontSize: 13 }}>
              No quiz attempts yet.
            </p>
          ) : (
            recentQuizzes.slice(0, 5).map((s) => (
              <div
                key={s._id}
                style={{
                  padding: "10px 0",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: "var(--text)",
                      }}
                    >
                      {s.quiz?.title}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text2)" }}>
                      Attempt #{s.attemptNumber}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: s.passed ? "var(--green)" : "var(--red)",
                      }}
                    >
                      {s.percentage}%
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: s.passed ? "var(--green)" : "var(--red)",
                      }}
                    >
                      {s.passed ? "Passed" : "Failed"}
                    </div>
                  </div>
                </div>
                {s.instructorFeedback && (
                  <div
                    style={{
                      marginTop: 6,
                      padding: "6px 10px",
                      background: "rgba(108,143,255,0.08)",
                      borderRadius: 6,
                      borderLeft: "3px solid var(--accent)",
                      fontSize: 12,
                      color: "var(--text2)",
                    }}
                  >
                    <span style={{ color: "var(--accent)", fontWeight: 500 }}>
                      Instructor:{" "}
                    </span>
                    {s.instructorFeedback}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export const BrowseCoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const fetchCourses = () => {
    setLoading(true);
    courseAPI
      .getAll({ search, category })
      .then((r) => setCourses(r.data.data || []))
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    fetchCourses();
  }, []);
  const handleEnroll = async (courseId) => {
    try {
      await enrollAPI.enroll(courseId);
      toast.success("Enrolled!");
      fetchCourses();
    } catch {}
  };
  return (
    <DashboardLayout title="Browse Courses">
      <div style={{ marginBottom: 24 }}>
        <h1 className="page-title">Browse Courses</h1>
        <p className="page-subtitle">Explore all available courses</p>
      </div>
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <input
          className="form-input"
          placeholder="Search courses..."
          style={{ maxWidth: 300 }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchCourses()}
        />
        <select
          className="form-input"
          style={{ maxWidth: 180 }}
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            fetchCourses();
          }}
        >
          <option value="">All Categories</option>
          <option>Programming</option>
          <option>Design</option>
          <option>Business</option>
          <option>Data Science</option>
          <option>Marketing</option>
        </select>
        <button className="btn btn-primary btn-sm" onClick={fetchCourses}>
          Search
        </button>
      </div>
      {loading ? (
        <Spinner />
      ) : (
        <div className="grid-3">
          {courses.map((course) => (
            <CourseCard
              key={course._id}
              course={course}
              onEnroll={handleEnroll}
            />
          ))}
        </div>
      )}
      {!loading && courses.length === 0 && (
        <div className="empty-state">
          <BookOpen size={48} />
          <p>No courses found</p>
        </div>
      )}
    </DashboardLayout>
  );
};

const CourseCard = ({ course, onEnroll }) => (
  <div className="card" style={{ padding: 0, overflow: "hidden" }}>
    {course.thumbnail ? (
      <img
        src={course.thumbnail}
        alt={course.title}
        style={{ width: "100%", height: 140, objectFit: "cover" }}
      />
    ) : (
      <div
        style={{
          width: "100%",
          height: 140,
          background: "var(--bg4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <BookOpen size={32} color="var(--text3)" />
      </div>
    )}
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
        <span className="badge badge-blue" style={{ fontSize: 11 }}>
          {course.category}
        </span>
        <span className="badge badge-gray" style={{ fontSize: 11 }}>
          {course.level}
        </span>
      </div>
      <h3
        style={{
          fontSize: 14,
          fontWeight: 600,
          marginBottom: 6,
          lineHeight: 1.4,
        }}
      >
        {course.title}
      </h3>
      <p style={{ fontSize: 12, color: "var(--text2)", marginBottom: 10 }}>
        by {course.instructor?.name}
      </p>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Star size={13} color="var(--gold)" fill="var(--gold)" />
          <span style={{ fontSize: 12, color: "var(--text2)" }}>
            {course.rating?.average || "New"}
          </span>
        </div>
        <span style={{ fontSize: 12, color: "var(--text2)" }}>
          {course.totalLectures} lectures
        </span>
      </div>
      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        <Link
          to={`/student/course/${course._id}`}
          className="btn btn-ghost btn-sm"
          style={{ flex: 1, justifyContent: "center" }}
        >
          Details
        </Link>
        <button
          className="btn btn-primary btn-sm"
          style={{ flex: 1, justifyContent: "center" }}
          onClick={() => onEnroll(course._id)}
        >
          Enroll
        </button>
      </div>
    </div>
  </div>
);

export const MyCoursesPage = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    enrollAPI
      .getMyEnrollments()
      .then((r) => setEnrollments(r.data.data || []))
      .catch(() => setEnrollments([]))
      .finally(() => setLoading(false));
  }, []);
  return (
    <DashboardLayout title="My Courses">
      <div style={{ marginBottom: 24 }}>
        <h1 className="page-title">My Courses</h1>
        <p className="page-subtitle">Your enrolled courses</p>
      </div>
      {loading ? (
        <Spinner />
      ) : (
        <div className="grid-2">
          {enrollments.map((en) => (
            <div
              className="card"
              key={en._id}
              style={{ display: "flex", flexDirection: "column", gap: 12 }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <h3 style={{ fontSize: 15, fontWeight: 600, flex: 1 }}>
                  {en.course?.title}
                </h3>
                <StatusBadge status={en.status} />
              </div>
              <p style={{ fontSize: 13, color: "var(--text2)" }}>
                {en.course?.category}
              </p>
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 6,
                  }}
                >
                  <span style={{ fontSize: 12, color: "var(--text2)" }}>
                    Progress
                  </span>
                  <span style={{ fontSize: 12 }}>{en.progressPercent}%</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill green"
                    style={{ width: `${en.progressPercent}%` }}
                  />
                </div>
              </div>
              <Link
                to={`/student/course/${en.course?._id}`}
                className="btn btn-primary btn-sm"
                style={{ width: "fit-content" }}
              >
                <Play size={14} />
                {en.status === "completed" ? "Review" : "Continue"}
              </Link>
            </div>
          ))}
        </div>
      )}
      {!loading && enrollments.length === 0 && (
        <div className="empty-state">
          <BookOpen size={48} />
          <p>
            No courses yet.{" "}
            <Link to="/student/courses" style={{ color: "var(--accent)" }}>
              Browse and enroll!
            </Link>
          </p>
        </div>
      )}
    </DashboardLayout>
  );
};

export const CourseDetailPage = () => {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState(null);
  const [activeLecture, setActiveLecture] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  useEffect(() => {
    Promise.all([
      courseAPI.getOne(id),
      quizAPI.getCourseQuizzes(id).catch(() => ({ data: { data: [] } })),
    ])
      .then(([cr, qr]) => {
        setCourse(cr.data.data);
        setQuizzes(qr.data.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);
  const markComplete = async (lectureId) => {
    try {
      await enrollAPI.updateProgress(id, { lectureId, completed: true });
      toast.success("Lecture marked complete!");
    } catch {}
  };
  if (loading)
    return (
      <DashboardLayout title="Course">
        <Spinner />
      </DashboardLayout>
    );
  if (!course)
    return (
      <DashboardLayout title="Course">
        <p style={{ color: "var(--text2)" }}>Course not found.</p>
      </DashboardLayout>
    );
  return (
    <DashboardLayout title={course.title}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 340px",
          gap: 24,
          alignItems: "start",
        }}
      >
        <div>
          {activeVideo ? (
            <div
              style={{
                borderRadius: "var(--radius-lg)",
                overflow: "hidden",
                marginBottom: 20,
                background: "#000",
              }}
            >
              {isYouTube(activeVideo) ? (
                <div
                  style={{
                    background: "var(--bg3)",
                    padding: 40,
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 48, marginBottom: 16 }}>▶️</div>
                  <h3
                    style={{ fontFamily: "var(--font-serif)", marginBottom: 8 }}
                  >
                    {activeLecture?.title}
                  </h3>
                  <p
                    style={{
                      color: "var(--text2)",
                      fontSize: 13,
                      marginBottom: 20,
                    }}
                  >
                    Click below to watch this lecture on YouTube
                  </p>
                  <a
                    href={activeVideo}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary btn-lg"
                    style={{ display: "inline-flex" }}
                  >
                    Watch on YouTube
                  </a>
                  <p
                    style={{
                      fontSize: 12,
                      color: "var(--text3)",
                      marginTop: 16,
                      wordBreak: "break-all",
                    }}
                  >
                    {activeVideo}
                  </p>
                </div>
              ) : (
                <video
                  src={activeVideo}
                  controls
                  style={{ width: "100%", maxHeight: 450 }}
                />
              )}
            </div>
          ) : (
            <div
              style={{
                background: "var(--bg3)",
                borderRadius: "var(--radius-lg)",
                padding: 40,
                textAlign: "center",
                marginBottom: 20,
              }}
            >
              <Play size={48} color="var(--text3)" />
              <p style={{ color: "var(--text2)", marginTop: 12 }}>
                Select a lecture to start watching
              </p>
            </div>
          )}
          <div className="card">
            <h1
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: 22,
                marginBottom: 8,
              }}
            >
              {course.title}
            </h1>
            <p style={{ color: "var(--text2)", fontSize: 14, lineHeight: 1.7 }}>
              {course.description}
            </p>
            <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
              <span className="badge badge-blue">{course.category}</span>
              <span className="badge badge-gray">{course.level}</span>
              <span className="badge badge-gray">{course.language}</span>
            </div>
          </div>
          {quizzes.length > 0 && (
            <div className="card" style={{ marginTop: 16 }}>
              <h3 style={{ fontFamily: "var(--font-serif)", marginBottom: 16 }}>
                Quizzes
              </h3>
              {quizzes.map((quiz) => (
                <div
                  key={quiz._id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 0",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>
                      {quiz.title}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text2)" }}>
                      {quiz.totalMarks} marks · {quiz.durationMins} min
                    </div>
                  </div>
                  <Link
                    to={`/student/quiz/${quiz._id}`}
                    className="btn btn-primary btn-sm"
                  >
                    Start Quiz
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="card" style={{ position: "sticky", top: 76 }}>
          <h3 style={{ fontFamily: "var(--font-serif)", marginBottom: 16 }}>
            Curriculum
          </h3>
          {course.modules?.map((mod, mi) => (
            <div key={mi} style={{ marginBottom: 16 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text2)",
                  marginBottom: 8,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Module {mi + 1}: {mod.title}
              </div>
              {mod.lectures?.map((lec, li) => (
                <div
                  key={li}
                  style={{
                    borderBottom: "1px solid var(--border)",
                    paddingBottom: 8,
                    marginBottom: 8,
                  }}
                >
                  <div
                    onClick={() => {
                      if (lec.videoUrl) {
                        setActiveVideo(lec.videoUrl);
                        setActiveLecture(lec);
                      }
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "6px 0",
                      cursor: lec.videoUrl ? "pointer" : "default",
                    }}
                  >
                    <Play
                      size={14}
                      color={lec.videoUrl ? "var(--accent)" : "var(--text3)"}
                    />
                    <span
                      style={{
                        fontSize: 13,
                        flex: 1,
                        color: lec.videoUrl ? "var(--text)" : "var(--text3)",
                        fontWeight: activeLecture?._id === lec._id ? 600 : 400,
                      }}
                    >
                      {lec.title}
                    </span>
                    {lec.isFree && (
                      <span
                        className="badge badge-green"
                        style={{ fontSize: 10 }}
                      >
                        Free
                      </span>
                    )}
                    {lec.videoUrl && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markComplete(lec._id);
                        }}
                        title="Mark complete"
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--green)",
                        }}
                      >
                        <CheckCircle size={14} />
                      </button>
                    )}
                  </div>
                  {lec.materials?.length > 0 && (
                    <div
                      style={{
                        paddingLeft: 24,
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                      }}
                    >
                      {lec.materials.map((mat, mi2) => (
                        <a
                          key={mi2}
                          href={mat.url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: 12,
                            color: "var(--accent)",
                            textDecoration: "none",
                          }}
                        >
                          <FileText size={12} />
                          {mat.name || `Material ${mi2 + 1}`}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export const QuizPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    quizAPI
      .getOne(id)
      .then((r) => setQuiz(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);
  const handleSubmit = async () => {
    const formatted = (quiz.questions || []).map((q, i) => ({
      questionId: q._id || String(i),
      selectedOption: answers[i] || "",
    }));
    setSubmitting(true);
    try {
      const r = await quizAPI.submit(id, {
        answers: formatted,
        timeTakenSecs: 0,
      });
      setResult(r.data.data);
    } catch {
    } finally {
      setSubmitting(false);
    }
  };
  if (loading)
    return (
      <DashboardLayout title="Quiz">
        <Spinner />
      </DashboardLayout>
    );
  if (!quiz)
    return (
      <DashboardLayout title="Quiz">
        <p style={{ color: "var(--text2)" }}>Quiz not found.</p>
      </DashboardLayout>
    );
  if (result)
    return (
      <DashboardLayout title="Quiz Result">
        <div
          style={{ maxWidth: 560, margin: "40px auto" }}
          className="card fade-in"
        >
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 56, marginBottom: 8 }}>
              {result.passed ? "🎉" : "📚"}
            </div>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 24 }}>
              {result.passed ? "Congratulations!" : "Keep Practicing!"}
            </h2>
          </div>
          <div className="grid-2" style={{ marginBottom: 20 }}>
            <div className="stat-card">
              <div
                className="stat-value"
                style={{ color: result.passed ? "var(--green)" : "var(--red)" }}
              >
                {result.percentage}%
              </div>
              <div className="stat-label">Score</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {result.obtainedMarks}/{result.totalMarks}
              </div>
              <div className="stat-label">Marks</div>
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <h3
              style={{
                fontFamily: "var(--font-serif)",
                marginBottom: 12,
                fontSize: 16,
              }}
            >
              Answer Review
            </h3>
            {(result.gradedAnswers || []).map((ans, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 12px",
                  borderRadius: 8,
                  background: ans.isCorrect
                    ? "rgba(52,211,153,0.08)"
                    : "rgba(248,113,113,0.08)",
                  border: `1px solid ${ans.isCorrect ? "rgba(52,211,153,0.2)" : "rgba(248,113,113,0.2)"}`,
                  marginBottom: 6,
                  fontSize: 13,
                }}
              >
                {ans.isCorrect ? (
                  <CheckCircle size={14} color="var(--green)" />
                ) : (
                  <XCircle size={14} color="var(--red)" />
                )}
                <span style={{ flex: 1, color: "var(--text2)" }}>Q{i + 1}</span>
                <span
                  style={{
                    color: ans.isCorrect ? "var(--green)" : "var(--red)",
                    fontWeight: 500,
                  }}
                >
                  {ans.isCorrect ? `+${ans.marksObtained} marks` : "0 marks"}
                </span>
              </div>
            ))}
          </div>
          <div
            style={{
              textAlign: "center",
              display: "flex",
              gap: 12,
              justifyContent: "center",
            }}
          >
            <button className="btn btn-ghost" onClick={() => setResult(null)}>
              Try Again
            </button>
            <button
              className="btn btn-primary"
              onClick={() => navigate("/student/my-courses")}
            >
              My Courses
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  return (
    <DashboardLayout title={quiz.title}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 className="page-title">{quiz.title}</h1>
          <p className="page-subtitle">
            {quiz.questions?.length} questions · {quiz.durationMins} minutes ·{" "}
            {quiz.totalMarks} marks
          </p>
        </div>
        {(quiz.questions || []).map((q, i) => (
          <div className="card" key={i} style={{ marginBottom: 16 }}>
            <p
              style={{
                fontSize: 15,
                fontWeight: 500,
                marginBottom: 16,
                lineHeight: 1.5,
              }}
            >
              <span style={{ color: "var(--text3)", marginRight: 8 }}>
                Q{i + 1}.
              </span>
              {q.questionText}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(q.options || []).map((opt, oi) => (
                <label
                  key={oi}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 14px",
                    borderRadius: 8,
                    background:
                      answers[i] === opt.text
                        ? "rgba(108,143,255,0.12)"
                        : "var(--bg3)",
                    border: `1px solid ${answers[i] === opt.text ? "var(--accent)" : "var(--border)"}`,
                    cursor: "pointer",
                    fontSize: 14,
                  }}
                >
                  <input
                    type="radio"
                    name={`q${i}`}
                    value={opt.text}
                    checked={answers[i] === opt.text}
                    onChange={() => setAnswers({ ...answers, [i]: opt.text })}
                    style={{ accentColor: "var(--accent)" }}
                  />
                  {opt.text}
                </label>
              ))}
            </div>
          </div>
        ))}
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <button
            className="btn btn-primary btn-lg"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Submit Quiz"}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export const CertificatesPage = () => {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewCert, setViewCert] = useState(null);

  useEffect(() => {
    progressAPI.getDashboard()
      .then(r => setData(r.data.data))
      .catch(() => setData({ certificates:[] }))
      .finally(() => setLoading(false));
  }, []);

  const certs = data?.certificates || [];

  const printCertificate = (cert) => {
  const studentName = localStorage.getItem('userName') || 
                      JSON.parse(localStorage.getItem('user') || '{}').name || 
                      'Student';
  
  const win = window.open('', '_blank');
  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Certificate — ${cert.course?.title}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,500;1,700&family=Inter:wght@300;400;500&display=swap');
        
        * { margin:0; padding:0; box-sizing:border-box; }
        
        body {
          background: #f0ede8;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 20px;
          font-family: 'Inter', sans-serif;
        }

        .no-print {
          margin-bottom: 24px;
          display: flex;
          gap: 12px;
        }
        .no-print button {
          padding: 12px 32px;
          border: none;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
        }
        .btn-print {
          background: linear-gradient(135deg, #6366f1, #d946ef);
          color: white;
        }
        .btn-close {
          background: #e5e5e5;
          color: #333;
        }

        .cert-wrap {
          position: relative;
          width: 860px;
          padding: 8px;
          background: linear-gradient(135deg, #6366f1 0%, #d946ef 50%, #f43f5e 100%);
          border-radius: 4px;
          box-shadow: 0 24px 80px rgba(0,0,0,0.25);
        }

        .cert {
          background: #fffef9;
          padding: 64px 80px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }

        /* Decorative corners */
        .cert::before, .cert::after {
          content: '✦';
          position: absolute;
          font-size: 60px;
          color: rgba(99,102,241,0.06);
        }
        .cert::before { top: 20px; left: 20px; }
        .cert::after  { bottom: 20px; right: 20px; transform: rotate(45deg); }

        /* Inner border */
        .inner-border {
          position: absolute;
          inset: 20px;
          border: 1px solid rgba(99,102,241,0.15);
          pointer-events: none;
        }
        .inner-border::before, .inner-border::after {
          content: '◆';
          position: absolute;
          font-size: 12px;
          color: rgba(99,102,241,0.3);
        }
        .inner-border::before { top: -8px; left: 50%; transform: translateX(-50%); }
        .inner-border::after  { bottom: -8px; left: 50%; transform: translateX(-50%); }

        .platform-name {
          font-family: 'Cinzel', serif;
          font-size: 11px;
          letter-spacing: 0.35em;
          text-transform: uppercase;
          color: #6366f1;
          margin-bottom: 32px;
        }

        .cert-title {
          font-family: 'Cinzel', serif;
          font-size: 52px;
          font-weight: 700;
          color: #0a0a1a;
          line-height: 1;
          margin-bottom: 6px;
          letter-spacing: 0.05em;
        }

        .cert-subtitle {
          font-family: 'Cinzel', serif;
          font-size: 12px;
          letter-spacing: 0.4em;
          color: #999;
          margin-bottom: 44px;
        }

        .presented-to {
          font-family: 'Cormorant Garamond', serif;
          font-size: 16px;
          color: #888;
          font-style: italic;
          margin-bottom: 12px;
          letter-spacing: 0.05em;
        }

        .student-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 54px;
          font-weight: 700;
          font-style: italic;
          background: linear-gradient(135deg, #6366f1, #d946ef, #f43f5e);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1.1;
          margin-bottom: 8px;
          padding: 0 20px;
        }

        .name-line {
          width: 300px;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(99,102,241,0.4), transparent);
          margin: 8px auto 36px;
        }

        .completed-text {
          font-family: 'Cormorant Garamond', serif;
          font-size: 17px;
          color: #777;
          font-style: italic;
          margin-bottom: 10px;
        }

        .course-name {
          font-family: 'Cinzel', serif;
          font-size: 22px;
          font-weight: 600;
          color: #1a1a2e;
          margin-bottom: 44px;
          padding: 12px 32px;
          border-top: 1px solid rgba(99,102,241,0.2);
          border-bottom: 1px solid rgba(99,102,241,0.2);
          display: inline-block;
        }

        .seal-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 32px;
          margin-bottom: 48px;
        }
        .seal-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(99,102,241,0.2));
          max-width: 200px;
        }
        .seal-line.right {
          background: linear-gradient(90deg, rgba(99,102,241,0.2), transparent);
        }
        .seal {
          width: 88px;
          height: 88px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #d946ef);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 38px;
          box-shadow: 0 8px 32px rgba(99,102,241,0.35), 0 0 0 6px rgba(99,102,241,0.08);
        }

        .footer {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          border-top: 1px solid #eee;
          padding-top: 24px;
        }
        .footer-item { text-align: center; flex: 1; }
        .footer-label {
          font-family: 'Cinzel', serif;
          font-size: 9px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #bbb;
          margin-bottom: 6px;
        }
        .footer-value {
          font-size: 13px;
          font-weight: 500;
          color: #444;
          font-family: 'Inter', sans-serif;
        }
        .footer-mono {
          font-family: monospace;
          font-size: 10px;
          color: #888;
          letter-spacing: 0.05em;
        }

        @media print {
          body { background: white; min-height: unset; padding: 0; }
          .no-print { display: none !important; }
          .cert-wrap { box-shadow: none; }
        }
      </style>
    </head>
    <body>
      <div class="no-print">
        <button class="btn-print" onclick="window.print()">🖨️ Save as PDF / Print</button>
        <button class="btn-close" onclick="window.close()">✕ Close</button>
      </div>

      <div class="cert-wrap">
        <div class="cert">
          <div class="inner-border"></div>

          <div class="platform-name">✦ &nbsp; EduSphere Learning Platform &nbsp; ✦</div>

          <div class="cert-title">Certificate</div>
          <div class="cert-subtitle">of &nbsp; Completion</div>

          <div class="presented-to">This is to proudly certify that</div>

          <div class="student-name">${studentName}</div>
          <div class="name-line"></div>

          <div class="completed-text">has successfully completed the course</div>

          <div class="course-name">${cert.course?.title || 'Course'}</div>

          <div class="seal-row">
            <div class="seal-line"></div>
            <div class="seal">🎓</div>
            <div class="seal-line right"></div>
          </div>

          <div class="footer">
            <div class="footer-item">
              <div class="footer-label">Date Issued</div>
              <div class="footer-value">
                ${new Date(cert.issuedAt).toLocaleDateString('en-IN', { 
                  year:'numeric', month:'long', day:'numeric' 
                })}
              </div>
            </div>
            <div class="footer-item">
              <div class="footer-label">Certificate ID</div>
              <div class="footer-mono">${cert.certificateId}</div>
            </div>
            <div class="footer-item">
              <div class="footer-label">Issued By</div>
              <div class="footer-value">EduSphere</div>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `);
  win.document.close();
};

  return (
    <DashboardLayout title="Certificates">
      <div style={{ marginBottom:24 }}>
        <h1 className="page-title">My Certificates</h1>
        <p className="page-subtitle">Your earned achievements</p>
      </div>
      {loading ? <Spinner/> : certs.length === 0
        ? <div className="empty-state"><Award size={48}/><p>Complete courses to earn certificates</p></div>
        : (
          <div className="grid-2">
            {certs.map(cert => (
              <div className="card" key={cert._id}
                style={{ borderColor:'rgba(245,158,11,0.3)', background:'linear-gradient(135deg, var(--bg2), var(--bg3))' }}>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
                  <div style={{ width:52, height:52, borderRadius:'50%',
                    background:'linear-gradient(135deg, #f59e0b, #d97706)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    boxShadow:'0 4px 20px rgba(245,158,11,0.3)', flexShrink:0 }}>
                    <Award size={24} color="#fff"/>
                  </div>
                  <div>
                    <div style={{ fontWeight:700, fontSize:16, marginBottom:2 }}>
                      {cert.course?.title}
                    </div>
                    <div style={{ fontSize:12, color:'var(--text2)' }}>
                      Issued {new Date(cert.issuedAt).toLocaleDateString('en-IN', { year:'numeric', month:'long', day:'numeric' })}
                    </div>
                  </div>
                </div>

                <div style={{ padding:'10px 14px', background:'rgba(0,0,0,0.2)',
                  borderRadius:8, marginBottom:16, fontFamily:'monospace',
                  fontSize:11, color:'var(--text3)', letterSpacing:'0.05em' }}>
                  ID: {cert.certificateId}
                </div>

                <div style={{ display:'flex', gap:10 }}>
                  <button
                    className="btn btn-gold btn-sm"
                    style={{ flex:1, justifyContent:'center' }}
                    onClick={() => printCertificate(cert)}>
                    <Award size={14}/> View & Download
                  </button>
                  {cert.certificateUrl && (
                    <a href={cert.certificateUrl} target="_blank" rel="noreferrer"
                      className="btn btn-ghost btn-sm">
                      PDF
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      }
    </DashboardLayout>
  );
};

export const ProgressPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    progressAPI
      .getDashboard()
      .then((r) => setData(r.data.data))
      .catch(() => setData({ enrollments: [] }))
      .finally(() => setLoading(false));
  }, []);
  const enrollments = data?.enrollments || [];
  return (
    <DashboardLayout title="Progress">
      <div style={{ marginBottom: 24 }}>
        <h1 className="page-title">My Progress</h1>
        <p className="page-subtitle">Track your learning journey</p>
      </div>
      {loading ? (
        <Spinner />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {enrollments.map((en) => (
            <div className="card" key={en._id}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 600 }}>
                    {en.course?.title}
                  </h3>
                  <p
                    style={{
                      fontSize: 12,
                      color: "var(--text2)",
                      marginTop: 2,
                    }}
                  >
                    {en.course?.category}
                  </p>
                </div>
                <StatusBadge status={en.status} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div className="progress-bar" style={{ flex: 1 }}>
                  <div
                    className="progress-fill"
                    style={{
                      width: `${en.progressPercent}%`,
                      background:
                        en.status === "completed"
                          ? "var(--green)"
                          : "var(--accent)",
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    minWidth: 40,
                    textAlign: "right",
                    color:
                      en.status === "completed"
                        ? "var(--green)"
                        : "var(--accent)",
                  }}
                >
                  {en.progressPercent}%
                </span>
              </div>
              {en.status === "completed" && en.certificateIssuedAt && (
                <p
                  style={{ fontSize: 12, color: "var(--green)", marginTop: 8 }}
                >
                  Certificate issued{" "}
                  {new Date(en.certificateIssuedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          ))}
          {enrollments.length === 0 && (
            <div className="empty-state">
              <TrendingUp size={48} />
              <p>Enroll in courses to track progress</p>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
};
