import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

import { Save, RotateCcw, Settings2, Circle } from "lucide-react";

import { Assessment } from "../../Assessment/AssessmentCard";

const API = import.meta.env.VITE_API_URL;

interface Props {
  assessment: Assessment;
}

interface Settings {
  general: {
    title: string;
    category: string;
    description: string;
    instructions: string;
    visibility: "PUBLIC" | "PRIVATE" | "INVITE_ONLY";
    assessmentCode: string;
    version: string;
    createdAt: string;
    updatedAt: string;
  };

  schedule: {
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    duration: number;
    graceTime: number;
    timezone: string;
    autoStart: boolean;
    autoEnd: boolean;
  };
  login: {
    otpRequired: boolean;
    emailLogin: boolean;
    rollNumberLogin: boolean;
    allowedStudentsOnly: boolean;
    singleDevice: boolean;
    allowRelogin: boolean;
    loginWindow: number;
    maxLoginAttempts: number;
  };
  rules: {
    randomQuestions: boolean;
    randomOptions: boolean;
    negativeMarking: boolean;
    negativeMarks: number;
    allowReview: boolean;
    showQuestionPalette: boolean;
    showProgressBar: boolean;
    autoSubmit: boolean;
    showMarks: boolean;
    showDifficulty: boolean;
  };
  security: {
    fullscreenRequired: boolean;
    detectTabSwitch: boolean;
    maxTabSwitches: number;
    disableCopy: boolean;
    disablePaste: boolean;
    disableRightClick: boolean;
    developerToolsDetection: boolean;
    browserLock: boolean;
    windowBlurDetection: boolean;
    webcamProctoring: boolean;
  };
  results: {
    publishResults: "IMMEDIATE" | "MANUAL" | "AFTER_END";
    leaderboardEnabled: boolean;
    showScore: boolean;
    showRank: boolean;
    showCorrectAnswers: boolean;
    showExplanation: boolean;
    passingPercentage: number;
    generateCertificates: boolean;
  };
  notifications: {
    sendOtpEmail: boolean;
    sendWelcomeEmail: boolean;
    sendReminderEmail: boolean;
    sendSubmissionEmail: boolean;
    sendResultEmail: boolean;
    sendCertificateEmail: boolean;
    reminderBeforeMinutes: number;
  };
  certificate: {
    enabled: boolean;
    passingPercentage: number;
    templateName: string;
    certificatePrefix: string;
    autoGenerate: boolean;
    sendEmail: boolean;
    digitalSignature: boolean;
  };
}

export default function Settings({ assessment }: Props) {
  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState<Settings>({
    general: {
      title: "",
      category: "",
      description: "",
      instructions: "",
      visibility: "PRIVATE",
      assessmentCode: "",
      version: "1.0",
      createdAt: "",
      updatedAt: "",
    },
    schedule: {
      startDate: "",
      startTime: "",
      endDate: "",
      endTime: "",
      duration: 30,
      graceTime: 5,
      timezone: "Asia/Kolkata",
      autoStart: false,
      autoEnd: true,
    },
    login: {
      otpRequired: true,
      emailLogin: true,
      rollNumberLogin: false,
      allowedStudentsOnly: true,
      singleDevice: true,
      allowRelogin: false,
      loginWindow: 15,
      maxLoginAttempts: 5,
    },
    rules: {
      randomQuestions: true,
      randomOptions: true,
      negativeMarking: false,
      negativeMarks: 0,
      allowReview: true,
      showQuestionPalette: true,
      showProgressBar: true,
      autoSubmit: true,
      showMarks: true,
      showDifficulty: false,
    },
    security: {
      fullscreenRequired: true,
      detectTabSwitch: true,
      maxTabSwitches: 3,
      disableCopy: true,
      disablePaste: true,
      disableRightClick: true,
      developerToolsDetection: true,
      browserLock: true,
      windowBlurDetection: true,
      webcamProctoring: false,
    },
    results: {
      publishResults: "AFTER_END",
      leaderboardEnabled: true,
      showScore: true,
      showRank: true,
      showCorrectAnswers: false,
      showExplanation: false,
      passingPercentage: 40,
      generateCertificates: false,
    },
    notifications: {
      sendOtpEmail: true,
      sendWelcomeEmail: false,
      sendReminderEmail: true,
      sendSubmissionEmail: true,
      sendResultEmail: false,
      sendCertificateEmail: false,
      reminderBeforeMinutes: 30,
    },
    certificate: {
      enabled: false,
      passingPercentage: 40,
      templateName: "Default Template",
      certificatePrefix: "AUS",
      autoGenerate: false,
      sendEmail: false,
      digitalSignature: false,
    },
  });

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem("token");

      const { data } = await axios.get(
        `${API}/api/assessment-settings/${assessment.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setSettings(data.settings);
    } catch (err) {
      console.error(err);

      toast.error("Unable to load settings.");
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);

      const token = localStorage.getItem("token");

      await axios.put(
        `${API}/api/assessment-settings/${assessment.id}`,
        settings,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      toast.success("Settings saved successfully.");
    } catch (err) {
      console.error(err);

      toast.error("Unable to save settings.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    void fetchSettings();
  }, []);

  if (loading) {
    return <div className="py-24 text-center">Loading Settings...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}

      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="flex items-center gap-3 text-3xl font-bold">
            <Settings2 size={30} className="text-[#00629B]" />
            Assessment Settings
          </h2>

          <p className="mt-2 text-gray-500">
            Configure assessment behaviour, security and results.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full bg-green-50 px-4 py-2">
            <Circle size={10} fill="currentColor" className="text-green-600" />

            <span className="text-sm font-medium">Active</span>
          </div>

          <button
            onClick={() => void fetchSettings()}
            className="rounded-xl border px-5 py-3 hover:bg-gray-50"
          >
            <RotateCcw size={18} />
          </button>

          <button
            onClick={() => void saveSettings()}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-[#00629B] px-6 py-3 text-white transition hover:bg-[#004F7A] disabled:opacity-50"
          >
            <Save size={18} />

            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* General Settings */}

      <div className="rounded-2xl border bg-white p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">General Settings</h2>

          <p className="mt-2 text-gray-500">Basic assessment information.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Assessment Title */}

          <div>
            <label className="mb-2 block font-medium">Assessment Title</label>

            <input
              value={settings.general.title}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  general: {
                    ...settings.general,
                    title: e.target.value,
                  },
                })
              }
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>

          {/* Category */}

          <div>
            <label className="mb-2 block font-medium">Category</label>

            <select
              value={settings.general.category}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  general: {
                    ...settings.general,
                    category: e.target.value,
                  },
                })
              }
              className="w-full rounded-xl border px-4 py-3"
            >
              <option>Technical</option>
              <option>Programming</option>
              <option>Aptitude</option>
              <option>Electronics</option>
              <option>General</option>
            </select>
          </div>

          {/* Visibility */}

          <div>
            <label className="mb-2 block font-medium">Visibility</label>

            <select
              value={settings.general.visibility}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  general: {
                    ...settings.general,
                    visibility: e.target.value as
                      | "PUBLIC"
                      | "PRIVATE"
                      | "INVITE_ONLY",
                  },
                })
              }
              className="w-full rounded-xl border px-4 py-3"
            >
              <option value="PUBLIC">Public</option>

              <option value="PRIVATE">Private</option>

              <option value="INVITE_ONLY">Invite Only</option>
            </select>
          </div>

          {/* Assessment Code */}

          <div>
            <label className="mb-2 block font-medium">Assessment Code</label>

            <input
              value={settings.general.assessmentCode}
              readOnly
              className="w-full rounded-xl border bg-gray-100 px-4 py-3"
            />
          </div>

          {/* Description */}

          <div className="md:col-span-2">
            <label className="mb-2 block font-medium">Description</label>

            <textarea
              rows={4}
              value={settings.general.description}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  general: {
                    ...settings.general,
                    description: e.target.value,
                  },
                })
              }
              className="w-full rounded-xl border p-4"
            />
          </div>

          {/* Instructions */}

          <div className="md:col-span-2">
            <label className="mb-2 block font-medium">Instructions</label>

            <textarea
              rows={6}
              value={settings.general.instructions}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  general: {
                    ...settings.general,
                    instructions: e.target.value,
                  },
                })
              }
              className="w-full rounded-xl border p-4"
            />
          </div>

          {/* Footer Information */}

          <div className="border-t pt-6 md:col-span-2">
            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <p className="text-sm text-gray-500">Version</p>

                <p className="font-semibold">{settings.general.version}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Created</p>

                <p className="font-semibold">
                  {settings.general.createdAt
                    ? new Date(settings.general.createdAt).toLocaleString()
                    : "-"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Last Updated</p>

                <p className="font-semibold">
                  {settings.general.updatedAt
                    ? new Date(settings.general.updatedAt).toLocaleString()
                    : "-"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Settings */}

      <div className="rounded-2xl border bg-white p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">Schedule Settings</h2>

          <p className="mt-2 text-gray-500">
            Configure when the assessment is available.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {/* Start Date */}

          <div>
            <label className="mb-2 block font-medium">Start Date</label>

            <input
              type="date"
              value={settings.schedule.startDate}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  schedule: {
                    ...settings.schedule,
                    startDate: e.target.value,
                  },
                })
              }
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>

          {/* Start Time */}

          <div>
            <label className="mb-2 block font-medium">Start Time</label>

            <input
              type="time"
              value={settings.schedule.startTime}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  schedule: {
                    ...settings.schedule,
                    startTime: e.target.value,
                  },
                })
              }
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>

          {/* End Date */}

          <div>
            <label className="mb-2 block font-medium">End Date</label>

            <input
              type="date"
              value={settings.schedule.endDate}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  schedule: {
                    ...settings.schedule,
                    endDate: e.target.value,
                  },
                })
              }
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>

          {/* End Time */}

          <div>
            <label className="mb-2 block font-medium">End Time</label>

            <input
              type="time"
              value={settings.schedule.endTime}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  schedule: {
                    ...settings.schedule,
                    endTime: e.target.value,
                  },
                })
              }
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>

          {/* Duration */}

          <div>
            <label className="mb-2 block font-medium">Duration (Minutes)</label>

            <input
              type="number"
              min={1}
              value={settings.schedule.duration}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  schedule: {
                    ...settings.schedule,
                    duration: Number(e.target.value),
                  },
                })
              }
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>

          {/* Grace Time */}

          <div>
            <label className="mb-2 block font-medium">
              Grace Time (Minutes)
            </label>

            <input
              type="number"
              min={0}
              value={settings.schedule.graceTime}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  schedule: {
                    ...settings.schedule,
                    graceTime: Number(e.target.value),
                  },
                })
              }
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>

          {/* Timezone */}

          <div>
            <label className="mb-2 block font-medium">Timezone</label>

            <select
              value={settings.schedule.timezone}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  schedule: {
                    ...settings.schedule,
                    timezone: e.target.value,
                  },
                })
              }
              className="w-full rounded-xl border px-4 py-3"
            >
              <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>

              <option value="UTC">UTC</option>

              <option value="Asia/Dubai">Asia/Dubai</option>

              <option value="Europe/London">Europe/London</option>

              <option value="America/New_York">America/New_York</option>
            </select>
          </div>

          {/* Auto Start */}

          <div className="flex items-center justify-between rounded-xl border p-5">
            <div>
              <p className="font-medium">Auto Start Assessment</p>

              <p className="text-sm text-gray-500">
                Automatically start at scheduled time.
              </p>
            </div>

            <input
              type="checkbox"
              checked={settings.schedule.autoStart}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  schedule: {
                    ...settings.schedule,
                    autoStart: e.target.checked,
                  },
                })
              }
              className="h-5 w-5 accent-[#00629B]"
            />
          </div>

          {/* Auto End */}

          <div className="flex items-center justify-between rounded-xl border p-5">
            <div>
              <p className="font-medium">Auto End Assessment</p>

              <p className="text-sm text-gray-500">
                Automatically close after end time.
              </p>
            </div>

            <input
              type="checkbox"
              checked={settings.schedule.autoEnd}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  schedule: {
                    ...settings.schedule,
                    autoEnd: e.target.checked,
                  },
                })
              }
              className="h-5 w-5 accent-[#00629B]"
            />
          </div>
        </div>
      </div>

      {/* Login & Access Settings */}

      <div className="rounded-2xl border bg-white p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">Login & Access Settings</h2>

          <p className="mt-2 text-gray-500">
            Configure how students authenticate and access this assessment.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-2">
          {/* OTP */}

          <div className="flex items-center justify-between rounded-xl border p-5">
            <div>
              <p className="font-medium">OTP Verification</p>

              <p className="text-sm text-gray-500">
                Students must verify using OTP.
              </p>
            </div>

            <input
              type="checkbox"
              checked={settings.login.otpRequired}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  login: {
                    ...settings.login,
                    otpRequired: e.target.checked,
                  },
                })
              }
              className="h-5 w-5 accent-[#00629B]"
            />
          </div>

          {/* Email Login */}

          <div className="flex items-center justify-between rounded-xl border p-5">
            <div>
              <p className="font-medium">Email Login</p>

              <p className="text-sm text-gray-500">Allow login using email.</p>
            </div>

            <input
              type="checkbox"
              checked={settings.login.emailLogin}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  login: {
                    ...settings.login,
                    emailLogin: e.target.checked,
                  },
                })
              }
              className="h-5 w-5 accent-[#00629B]"
            />
          </div>

          {/* Roll Number */}

          <div className="flex items-center justify-between rounded-xl border p-5">
            <div>
              <p className="font-medium">Roll Number Login</p>

              <p className="text-sm text-gray-500">
                Allow login using roll number.
              </p>
            </div>

            <input
              type="checkbox"
              checked={settings.login.rollNumberLogin}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  login: {
                    ...settings.login,
                    rollNumberLogin: e.target.checked,
                  },
                })
              }
              className="h-5 w-5 accent-[#00629B]"
            />
          </div>

          {/* Allowed Students */}

          <div className="flex items-center justify-between rounded-xl border p-5">
            <div>
              <p className="font-medium">Allowed Students Only</p>

              <p className="text-sm text-gray-500">
                Restrict access to imported students.
              </p>
            </div>

            <input
              type="checkbox"
              checked={settings.login.allowedStudentsOnly}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  login: {
                    ...settings.login,
                    allowedStudentsOnly: e.target.checked,
                  },
                })
              }
              className="h-5 w-5 accent-[#00629B]"
            />
          </div>

          {/* Single Device */}

          <div className="flex items-center justify-between rounded-xl border p-5">
            <div>
              <p className="font-medium">Single Device Login</p>

              <p className="text-sm text-gray-500">
                Prevent multiple device login.
              </p>
            </div>

            <input
              type="checkbox"
              checked={settings.login.singleDevice}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  login: {
                    ...settings.login,
                    singleDevice: e.target.checked,
                  },
                })
              }
              className="h-5 w-5 accent-[#00629B]"
            />
          </div>

          {/* Re-login */}

          <div className="flex items-center justify-between rounded-xl border p-5">
            <div>
              <p className="font-medium">Allow Re-login</p>

              <p className="text-sm text-gray-500">
                Permit students to login again after disconnect.
              </p>
            </div>

            <input
              type="checkbox"
              checked={settings.login.allowRelogin}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  login: {
                    ...settings.login,
                    allowRelogin: e.target.checked,
                  },
                })
              }
              className="h-5 w-5 accent-[#00629B]"
            />
          </div>

          {/* Login Window */}

          <div>
            <label className="mb-2 block font-medium">
              Login Window (Minutes)
            </label>

            <input
              type="number"
              min={1}
              value={settings.login.loginWindow}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  login: {
                    ...settings.login,
                    loginWindow: Number(e.target.value),
                  },
                })
              }
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>

          {/* Login Attempts */}

          <div>
            <label className="mb-2 block font-medium">
              Maximum Login Attempts
            </label>

            <input
              type="number"
              min={1}
              value={settings.login.maxLoginAttempts}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  login: {
                    ...settings.login,
                    maxLoginAttempts: Number(e.target.value),
                  },
                })
              }
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>
        </div>
      </div>

      {/* Assessment Rules */}

      <div className="rounded-2xl border bg-white p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">Assessment Rules</h2>

          <p className="mt-2 text-gray-500">
            Configure question behavior and assessment rules.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Random Questions */}

          <div className="flex items-center justify-between rounded-xl border p-5">
            <div>
              <p className="font-medium">Randomize Questions</p>

              <p className="text-sm text-gray-500">
                Shuffle question order for every student.
              </p>
            </div>

            <input
              type="checkbox"
              checked={settings.rules.randomQuestions}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  rules: {
                    ...settings.rules,
                    randomQuestions: e.target.checked,
                  },
                })
              }
              className="h-5 w-5 accent-[#00629B]"
            />
          </div>

          {/* Random Options */}

          <div className="flex items-center justify-between rounded-xl border p-5">
            <div>
              <p className="font-medium">Randomize Options</p>

              <p className="text-sm text-gray-500">Shuffle answer options.</p>
            </div>

            <input
              type="checkbox"
              checked={settings.rules.randomOptions}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  rules: {
                    ...settings.rules,
                    randomOptions: e.target.checked,
                  },
                })
              }
              className="h-5 w-5 accent-[#00629B]"
            />
          </div>

          {/* Negative Marking */}

          <div className="flex items-center justify-between rounded-xl border p-5">
            <div>
              <p className="font-medium">Negative Marking</p>

              <p className="text-sm text-gray-500">
                Deduct marks for incorrect answers.
              </p>
            </div>

            <input
              type="checkbox"
              checked={settings.rules.negativeMarking}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  rules: {
                    ...settings.rules,
                    negativeMarking: e.target.checked,
                  },
                })
              }
              className="h-5 w-5 accent-[#00629B]"
            />
          </div>

          {/* Negative Marks */}

          <div>
            <label className="mb-2 block font-medium">Negative Marks</label>

            <input
              type="number"
              step="0.25"
              min={0}
              value={settings.rules.negativeMarks}
              disabled={!settings.rules.negativeMarking}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  rules: {
                    ...settings.rules,
                    negativeMarks: Number(e.target.value),
                  },
                })
              }
              className="w-full rounded-xl border px-4 py-3 disabled:bg-gray-100"
            />
          </div>

          {/* Allow Review */}

          <div className="flex items-center justify-between rounded-xl border p-5">
            <div>
              <p className="font-medium">Allow Review</p>

              <p className="text-sm text-gray-500">
                Students can revisit previous questions.
              </p>
            </div>

            <input
              type="checkbox"
              checked={settings.rules.allowReview}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  rules: {
                    ...settings.rules,
                    allowReview: e.target.checked,
                  },
                })
              }
              className="h-5 w-5 accent-[#00629B]"
            />
          </div>

          {/* Question Palette */}

          <div className="flex items-center justify-between rounded-xl border p-5">
            <div>
              <p className="font-medium">Question Palette</p>

              <p className="text-sm text-gray-500">
                Show question navigation panel.
              </p>
            </div>

            <input
              type="checkbox"
              checked={settings.rules.showQuestionPalette}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  rules: {
                    ...settings.rules,
                    showQuestionPalette: e.target.checked,
                  },
                })
              }
              className="h-5 w-5 accent-[#00629B]"
            />
          </div>

          {/* Progress Bar */}

          <div className="flex items-center justify-between rounded-xl border p-5">
            <div>
              <p className="font-medium">Progress Bar</p>

              <p className="text-sm text-gray-500">
                Display answered progress.
              </p>
            </div>

            <input
              type="checkbox"
              checked={settings.rules.showProgressBar}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  rules: {
                    ...settings.rules,
                    showProgressBar: e.target.checked,
                  },
                })
              }
              className="h-5 w-5 accent-[#00629B]"
            />
          </div>

          {/* Auto Submit */}

          <div className="flex items-center justify-between rounded-xl border p-5">
            <div>
              <p className="font-medium">Auto Submit</p>

              <p className="text-sm text-gray-500">
                Submit automatically when time ends.
              </p>
            </div>

            <input
              type="checkbox"
              checked={settings.rules.autoSubmit}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  rules: {
                    ...settings.rules,
                    autoSubmit: e.target.checked,
                  },
                })
              }
              className="h-5 w-5 accent-[#00629B]"
            />
          </div>

          {/* Show Marks */}

          <div className="flex items-center justify-between rounded-xl border p-5">
            <div>
              <p className="font-medium">Show Marks</p>

              <p className="text-sm text-gray-500">
                Display marks for each question.
              </p>
            </div>

            <input
              type="checkbox"
              checked={settings.rules.showMarks}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  rules: {
                    ...settings.rules,
                    showMarks: e.target.checked,
                  },
                })
              }
              className="h-5 w-5 accent-[#00629B]"
            />
          </div>

          {/* Show Difficulty */}

          <div className="flex items-center justify-between rounded-xl border p-5">
            <div>
              <p className="font-medium">Show Difficulty</p>

              <p className="text-sm text-gray-500">
                Display difficulty level of questions.
              </p>
            </div>

            <input
              type="checkbox"
              checked={settings.rules.showDifficulty}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  rules: {
                    ...settings.rules,
                    showDifficulty: e.target.checked,
                  },
                })
              }
              className="h-5 w-5 accent-[#00629B]"
            />
          </div>
        </div>
      </div>

      {/* Security & Anti-Cheat */}

      <div className="rounded-2xl border bg-white p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">Security & Anti-Cheat</h2>

          <p className="mt-2 text-gray-500">
            Configure security measures to maintain assessment integrity.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Fullscreen */}

          <div className="flex items-center justify-between rounded-xl border p-5">
            <div>
              <p className="font-medium">Require Fullscreen</p>

              <p className="text-sm text-gray-500">
                Students must stay in fullscreen mode.
              </p>
            </div>

            <input
              type="checkbox"
              checked={settings.security.fullscreenRequired}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  security: {
                    ...settings.security,
                    fullscreenRequired: e.target.checked,
                  },
                })
              }
              className="h-5 w-5 accent-[#00629B]"
            />
          </div>

          {/* Tab Switching */}

          <div className="flex items-center justify-between rounded-xl border p-5">
            <div>
              <p className="font-medium">Detect Tab Switching</p>

              <p className="text-sm text-gray-500">
                Record tab changes during assessment.
              </p>
            </div>

            <input
              type="checkbox"
              checked={settings.security.detectTabSwitch}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  security: {
                    ...settings.security,
                    detectTabSwitch: e.target.checked,
                  },
                })
              }
              className="h-5 w-5 accent-[#00629B]"
            />
          </div>

          {/* Max Tab Switch */}

          <div>
            <label className="mb-2 block font-medium">
              Maximum Tab Switches
            </label>

            <input
              type="number"
              min={0}
              value={settings.security.maxTabSwitches}
              disabled={!settings.security.detectTabSwitch}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  security: {
                    ...settings.security,
                    maxTabSwitches: Number(e.target.value),
                  },
                })
              }
              className="w-full rounded-xl border px-4 py-3 disabled:bg-gray-100"
            />
          </div>

          {/* Disable Copy */}

          <div className="flex items-center justify-between rounded-xl border p-5">
            <div>
              <p className="font-medium">Disable Copy</p>

              <p className="text-sm text-gray-500">Prevent copying text.</p>
            </div>

            <input
              type="checkbox"
              checked={settings.security.disableCopy}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  security: {
                    ...settings.security,
                    disableCopy: e.target.checked,
                  },
                })
              }
              className="h-5 w-5 accent-[#00629B]"
            />
          </div>

          {/* Disable Paste */}

          <div className="flex items-center justify-between rounded-xl border p-5">
            <div>
              <p className="font-medium">Disable Paste</p>

              <p className="text-sm text-gray-500">
                Prevent pasting into answers.
              </p>
            </div>

            <input
              type="checkbox"
              checked={settings.security.disablePaste}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  security: {
                    ...settings.security,
                    disablePaste: e.target.checked,
                  },
                })
              }
              className="h-5 w-5 accent-[#00629B]"
            />
          </div>

          {/* Disable Right Click */}

          <div className="flex items-center justify-between rounded-xl border p-5">
            <div>
              <p className="font-medium">Disable Right Click</p>

              <p className="text-sm text-gray-500">
                Disable browser context menu.
              </p>
            </div>

            <input
              type="checkbox"
              checked={settings.security.disableRightClick}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  security: {
                    ...settings.security,
                    disableRightClick: e.target.checked,
                  },
                })
              }
              className="h-5 w-5 accent-[#00629B]"
            />
          </div>

          {/* Developer Tools */}

          <div className="flex items-center justify-between rounded-xl border p-5">
            <div>
              <p className="font-medium">Detect Developer Tools</p>

              <p className="text-sm text-gray-500">
                Detect browser developer tools.
              </p>
            </div>

            <input
              type="checkbox"
              checked={settings.security.developerToolsDetection}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  security: {
                    ...settings.security,
                    developerToolsDetection: e.target.checked,
                  },
                })
              }
              className="h-5 w-5 accent-[#00629B]"
            />
          </div>

          {/* Browser Lock */}

          <div className="flex items-center justify-between rounded-xl border p-5">
            <div>
              <p className="font-medium">Browser Lock</p>

              <p className="text-sm text-gray-500">
                Restrict browser navigation.
              </p>
            </div>

            <input
              type="checkbox"
              checked={settings.security.browserLock}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  security: {
                    ...settings.security,
                    browserLock: e.target.checked,
                  },
                })
              }
              className="h-5 w-5 accent-[#00629B]"
            />
          </div>

          {/* Window Blur */}

          <div className="flex items-center justify-between rounded-xl border p-5">
            <div>
              <p className="font-medium">Window Blur Detection</p>

              <p className="text-sm text-gray-500">
                Detect when the assessment window loses focus.
              </p>
            </div>

            <input
              type="checkbox"
              checked={settings.security.windowBlurDetection}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  security: {
                    ...settings.security,
                    windowBlurDetection: e.target.checked,
                  },
                })
              }
              className="h-5 w-5 accent-[#00629B]"
            />
          </div>

          {/* Webcam */}

          <div className="flex items-center justify-between rounded-xl border p-5">
            <div>
              <p className="font-medium">Webcam Proctoring</p>

              <p className="text-sm text-gray-500">
                Enable camera-based monitoring.
              </p>
            </div>

            <input
              type="checkbox"
              checked={settings.security.webcamProctoring}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  security: {
                    ...settings.security,
                    webcamProctoring: e.target.checked,
                  },
                })
              }
              className="h-5 w-5 accent-[#00629B]"
            />
          </div>
        </div>
      </div>

      {/* Result Settings */}

      <div className="rounded-2xl border bg-white p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">Result Settings</h2>

          <p className="mt-2 text-gray-500">
            Configure how assessment results are published and displayed.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Publish Results */}

          <div>
            <label className="mb-2 block font-medium">Publish Results</label>

            <select
              value={settings.results.publishResults}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  results: {
                    ...settings.results,
                    publishResults: e.target.value as
                      | "IMMEDIATE"
                      | "MANUAL"
                      | "AFTER_END",
                  },
                })
              }
              className="w-full rounded-xl border px-4 py-3"
            >
              <option value="IMMEDIATE">Immediately</option>

              <option value="AFTER_END">After Assessment Ends</option>

              <option value="MANUAL">Manual Release</option>
            </select>
          </div>

          {/* Passing Percentage */}

          <div>
            <label className="mb-2 block font-medium">Passing Percentage</label>

            <input
              type="number"
              min={0}
              max={100}
              value={settings.results.passingPercentage}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  results: {
                    ...settings.results,
                    passingPercentage: Number(e.target.value),
                  },
                })
              }
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>

          {/* Leaderboard */}

          <div className="flex items-center justify-between rounded-xl border p-5">
            <div>
              <p className="font-medium">Enable Leaderboard</p>

              <p className="text-sm text-gray-500">
                Display ranking after assessment.
              </p>
            </div>

            <input
              type="checkbox"
              checked={settings.results.leaderboardEnabled}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  results: {
                    ...settings.results,
                    leaderboardEnabled: e.target.checked,
                  },
                })
              }
              className="h-5 w-5 accent-[#00629B]"
            />
          </div>

          {/* Show Score */}

          <div className="flex items-center justify-between rounded-xl border p-5">
            <div>
              <p className="font-medium">Show Score</p>

              <p className="text-sm text-gray-500">Display obtained marks.</p>
            </div>

            <input
              type="checkbox"
              checked={settings.results.showScore}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  results: {
                    ...settings.results,
                    showScore: e.target.checked,
                  },
                })
              }
              className="h-5 w-5 accent-[#00629B]"
            />
          </div>

          {/* Show Rank */}

          <div className="flex items-center justify-between rounded-xl border p-5">
            <div>
              <p className="font-medium">Show Rank</p>

              <p className="text-sm text-gray-500">Display student ranking.</p>
            </div>

            <input
              type="checkbox"
              checked={settings.results.showRank}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  results: {
                    ...settings.results,
                    showRank: e.target.checked,
                  },
                })
              }
              className="h-5 w-5 accent-[#00629B]"
            />
          </div>

          {/* Correct Answers */}

          <div className="flex items-center justify-between rounded-xl border p-5">
            <div>
              <p className="font-medium">Show Correct Answers</p>

              <p className="text-sm text-gray-500">
                Reveal answers after completion.
              </p>
            </div>

            <input
              type="checkbox"
              checked={settings.results.showCorrectAnswers}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  results: {
                    ...settings.results,
                    showCorrectAnswers: e.target.checked,
                  },
                })
              }
              className="h-5 w-5 accent-[#00629B]"
            />
          </div>

          {/* Explanation */}

          <div className="flex items-center justify-between rounded-xl border p-5">
            <div>
              <p className="font-medium">Show Explanation</p>

              <p className="text-sm text-gray-500">
                Display explanations for questions.
              </p>
            </div>

            <input
              type="checkbox"
              checked={settings.results.showExplanation}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  results: {
                    ...settings.results,
                    showExplanation: e.target.checked,
                  },
                })
              }
              className="h-5 w-5 accent-[#00629B]"
            />
          </div>

          {/* Certificates */}

          <div className="flex items-center justify-between rounded-xl border p-5">
            <div>
              <p className="font-medium">Generate Certificates</p>

              <p className="text-sm text-gray-500">
                Generate certificates for eligible students.
              </p>
            </div>

            <input
              type="checkbox"
              checked={settings.results.generateCertificates}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  results: {
                    ...settings.results,
                    generateCertificates: e.target.checked,
                  },
                })
              }
              className="h-5 w-5 accent-[#00629B]"
            />
          </div>
        </div>
      </div>

      {/* Notification Settings */}

      <div className="rounded-2xl border bg-white p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">Notification Settings</h2>

          <p className="mt-2 text-gray-500">
            Configure automatic emails and notifications for students.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* OTP Email */}

          <div className="flex items-center justify-between rounded-xl border p-5">
            <div>
              <p className="font-medium">OTP Email</p>

              <p className="text-sm text-gray-500">Send OTP during login.</p>
            </div>

            <input
              type="checkbox"
              checked={settings.notifications.sendOtpEmail}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  notifications: {
                    ...settings.notifications,
                    sendOtpEmail: e.target.checked,
                  },
                })
              }
              className="h-5 w-5 accent-[#00629B]"
            />
          </div>

          {/* Welcome Email */}

          <div className="flex items-center justify-between rounded-xl border p-5">
            <div>
              <p className="font-medium">Welcome Email</p>

              <p className="text-sm text-gray-500">
                Send assessment invitation.
              </p>
            </div>

            <input
              type="checkbox"
              checked={settings.notifications.sendWelcomeEmail}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  notifications: {
                    ...settings.notifications,
                    sendWelcomeEmail: e.target.checked,
                  },
                })
              }
              className="h-5 w-5 accent-[#00629B]"
            />
          </div>

          {/* Reminder */}

          <div className="flex items-center justify-between rounded-xl border p-5">
            <div>
              <p className="font-medium">Reminder Email</p>

              <p className="text-sm text-gray-500">
                Send reminder before assessment starts.
              </p>
            </div>

            <input
              type="checkbox"
              checked={settings.notifications.sendReminderEmail}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  notifications: {
                    ...settings.notifications,
                    sendReminderEmail: e.target.checked,
                  },
                })
              }
              className="h-5 w-5 accent-[#00629B]"
            />
          </div>

          {/* Reminder Minutes */}

          <div>
            <label className="mb-2 block font-medium">
              Reminder Before (Minutes)
            </label>

            <input
              type="number"
              min={1}
              value={settings.notifications.reminderBeforeMinutes}
              disabled={!settings.notifications.sendReminderEmail}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  notifications: {
                    ...settings.notifications,
                    reminderBeforeMinutes: Number(e.target.value),
                  },
                })
              }
              className="w-full rounded-xl border px-4 py-3 disabled:bg-gray-100"
            />
          </div>

          {/* Submission */}

          <div className="flex items-center justify-between rounded-xl border p-5">
            <div>
              <p className="font-medium">Submission Email</p>

              <p className="text-sm text-gray-500">
                Send confirmation after submission.
              </p>
            </div>

            <input
              type="checkbox"
              checked={settings.notifications.sendSubmissionEmail}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  notifications: {
                    ...settings.notifications,
                    sendSubmissionEmail: e.target.checked,
                  },
                })
              }
              className="h-5 w-5 accent-[#00629B]"
            />
          </div>

          {/* Result */}

          <div className="flex items-center justify-between rounded-xl border p-5">
            <div>
              <p className="font-medium">Result Email</p>

              <p className="text-sm text-gray-500">
                Send result after publication.
              </p>
            </div>

            <input
              type="checkbox"
              checked={settings.notifications.sendResultEmail}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  notifications: {
                    ...settings.notifications,
                    sendResultEmail: e.target.checked,
                  },
                })
              }
              className="h-5 w-5 accent-[#00629B]"
            />
          </div>

          {/* Certificate */}

          <div className="flex items-center justify-between rounded-xl border p-5">
            <div>
              <p className="font-medium">Certificate Email</p>

              <p className="text-sm text-gray-500">
                Email certificate after generation.
              </p>
            </div>

            <input
              type="checkbox"
              checked={settings.notifications.sendCertificateEmail}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  notifications: {
                    ...settings.notifications,
                    sendCertificateEmail: e.target.checked,
                  },
                })
              }
              className="h-5 w-5 accent-[#00629B]"
            />
          </div>
        </div>
      </div>

      {/* Certificate Settings */}

      <div className="rounded-2xl border bg-white p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">Certificate Settings</h2>

          <p className="mt-2 text-gray-500">
            Configure certificate generation for successful participants.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Enable */}

          <div className="flex items-center justify-between rounded-xl border p-5">
            <div>
              <p className="font-medium">Enable Certificates</p>

              <p className="text-sm text-gray-500">
                Generate certificates for students.
              </p>
            </div>

            <input
              type="checkbox"
              checked={settings.certificate.enabled}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  certificate: {
                    ...settings.certificate,
                    enabled: e.target.checked,
                  },
                })
              }
              className="h-5 w-5 accent-[#00629B]"
            />
          </div>

          {/* Passing Percentage */}

          <div>
            <label className="mb-2 block font-medium">Passing Percentage</label>

            <input
              type="number"
              min={0}
              max={100}
              value={settings.certificate.passingPercentage}
              disabled={!settings.certificate.enabled}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  certificate: {
                    ...settings.certificate,
                    passingPercentage: Number(e.target.value),
                  },
                })
              }
              className="w-full rounded-xl border px-4 py-3 disabled:bg-gray-100"
            />
          </div>

          {/* Template */}

          <div>
            <label className="mb-2 block font-medium">
              Certificate Template
            </label>

            <select
              value={settings.certificate.templateName}
              disabled={!settings.certificate.enabled}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  certificate: {
                    ...settings.certificate,
                    templateName: e.target.value,
                  },
                })
              }
              className="w-full rounded-xl border px-4 py-3 disabled:bg-gray-100"
            >
              <option>Default Template</option>

              <option>IEEE Template</option>

              <option>University Template</option>
            </select>
          </div>

          {/* Prefix */}

          <div>
            <label className="mb-2 block font-medium">Certificate Prefix</label>

            <input
              value={settings.certificate.certificatePrefix}
              disabled={!settings.certificate.enabled}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  certificate: {
                    ...settings.certificate,
                    certificatePrefix: e.target.value,
                  },
                })
              }
              className="w-full rounded-xl border px-4 py-3 disabled:bg-gray-100"
            />
          </div>

          {/* Auto Generate */}

          <div className="flex items-center justify-between rounded-xl border p-5">
            <div>
              <p className="font-medium">Auto Generate</p>

              <p className="text-sm text-gray-500">
                Generate certificates automatically.
              </p>
            </div>

            <input
              type="checkbox"
              checked={settings.certificate.autoGenerate}
              disabled={!settings.certificate.enabled}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  certificate: {
                    ...settings.certificate,
                    autoGenerate: e.target.checked,
                  },
                })
              }
              className="h-5 w-5 accent-[#00629B]"
            />
          </div>

          {/* Email */}

          <div className="flex items-center justify-between rounded-xl border p-5">
            <div>
              <p className="font-medium">Email Certificate</p>

              <p className="text-sm text-gray-500">
                Send certificates by email.
              </p>
            </div>

            <input
              type="checkbox"
              checked={settings.certificate.sendEmail}
              disabled={!settings.certificate.enabled}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  certificate: {
                    ...settings.certificate,
                    sendEmail: e.target.checked,
                  },
                })
              }
              className="h-5 w-5 accent-[#00629B]"
            />
          </div>

          {/* Signature */}

          <div className="flex items-center justify-between rounded-xl border p-5">
            <div>
              <p className="font-medium">Digital Signature</p>

              <p className="text-sm text-gray-500">
                Add digital signature to certificates.
              </p>
            </div>

            <input
              type="checkbox"
              checked={settings.certificate.digitalSignature}
              disabled={!settings.certificate.enabled}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  certificate: {
                    ...settings.certificate,
                    digitalSignature: e.target.checked,
                  },
                })
              }
              className="h-5 w-5 accent-[#00629B]"
            />
          </div>
        </div>
      </div>
      {/* Danger Zone */}

      <div className="rounded-2xl border border-red-300 bg-red-50 p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-red-700">Danger Zone</h2>

          <p className="mt-2 text-red-600">
            These actions are irreversible. Proceed carefully.
          </p>
        </div>

        <div className="space-y-5">
          {/* Duplicate */}

          <div className="flex flex-col gap-4 rounded-xl border border-red-200 bg-white p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="font-semibold text-lg">Duplicate Assessment</h3>

              <p className="text-gray-500 mt-1">
                Create a copy of this assessment with all settings and question
                banks.
              </p>
            </div>

            <button
              onClick={() => {
                // duplicateAssessment(assessment.id)
              }}
              className="rounded-xl bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
            >
              Duplicate
            </button>
          </div>

          {/* Archive */}

          <div className="flex flex-col gap-4 rounded-xl border border-red-200 bg-white p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="font-semibold text-lg">Archive Assessment</h3>

              <p className="text-gray-500 mt-1">
                Archive this assessment. Students will no longer be able to
                access it.
              </p>
            </div>

            <button
              onClick={() => {
                // archiveAssessment(assessment.id)
              }}
              className="rounded-xl bg-yellow-500 px-6 py-3 text-white hover:bg-yellow-600"
            >
              Archive
            </button>
          </div>

          {/* Reset */}

          <div className="flex flex-col gap-4 rounded-xl border border-red-200 bg-white p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="font-semibold text-lg">Reset Assessment</h3>

              <p className="text-gray-500 mt-1">
                Remove all attempts, leaderboard data, analytics and student
                progress.
              </p>
            </div>

            <button
              onClick={() => {
                // resetAssessment(assessment.id)
              }}
              className="rounded-xl bg-orange-600 px-6 py-3 text-white hover:bg-orange-700"
            >
              Reset
            </button>
          </div>

          {/* Delete */}

          <div className="flex flex-col gap-4 rounded-xl border border-red-200 bg-white p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="font-semibold text-lg text-red-700">
                Delete Assessment
              </h3>

              <p className="text-gray-500 mt-1">
                Permanently delete this assessment, including all questions,
                attempts and analytics.
              </p>
            </div>

            <button
              onClick={() => {
                const confirmDelete = window.confirm(
                  "Are you sure you want to permanently delete this assessment?",
                );

                if (!confirmDelete) return;

                // deleteAssessment(assessment.id)
              }}
              className="rounded-xl bg-red-600 px-6 py-3 text-white hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
