"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getUserProgress, recordQuizAttempt, awardBadge } from "@/lib/storage";
import type { QuizQuestion } from "@/lib/content-types";

interface QuizClientProps {
  params: Promise<{ courseSlug: string; moduleSlug: string }>;
}

// We need to make this a dynamic client component that loads quiz data
import { use } from "react";

export default function QuizPage({ params }: QuizClientProps) {
  const { courseSlug, moduleSlug } = use(params);
  const router = useRouter();

  const [quiz, setQuiz] = useState<{
    passingScore: number;
    questions: QuizQuestion[];
    moduleTitle: string;
    moduleId: string;
    badgeIcon: string;
    badgeName: string;
    badgeDescription: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [userProgress, setUserProgress] = useState(getUserProgress(courseSlug));

  useEffect(() => {
    // Fetch quiz data from API route
    fetch(`/api/quiz?courseSlug=${courseSlug}&moduleSlug=${moduleSlug}`)
      .then((r) => r.json())
      .then((data) => {
        setQuiz(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [courseSlug, moduleSlug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="text-slate-400">Loading quiz...</div>
      </div>
    );
  }

  if (!quiz || quiz.questions.length === 0) {
    return (
      <div className="min-h-screen bg-[#0F172A]">
        <div className="container mx-auto max-w-4xl px-4 py-16 text-center">
          <p className="text-slate-400 mb-4">No quiz available for this module.</p>
          <Link
            href={`/courses/${courseSlug}/learn/${moduleSlug}`}
            className="text-orange-500 hover:underline"
          >
            ← Back to module
          </Link>
        </div>
      </div>
    );
  }

  const { questions, passingScore } = quiz;
  const totalQuestions = questions.length;
  const currentQuestion = questions[currentQuestionIndex];

  const handleSelectAnswer = (answerIndex: number) => {
    if (showExplanation) return;
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswers[currentQuestionIndex] === undefined) return;
    setShowExplanation(true);
  };

  const handleNextQuestion = () => {
    setShowExplanation(false);
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    let correctCount = 0;
    questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correctAnswer) {
        correctCount++;
      }
    });
    const finalScore = Math.round((correctCount / totalQuestions) * 100);
    const passed = finalScore >= passingScore;
    setScore(finalScore);
    setQuizCompleted(true);

    recordQuizAttempt(courseSlug, quiz.moduleId, {
      quizId: quiz.moduleId,
      score: finalScore,
      correctAnswers: correctCount,
      totalQuestions,
      answers: selectedAnswers.reduce(
        (acc, answer, idx) => {
          const questionId = questions[idx].id || `q-${idx}`;
          acc[questionId] = answer;
          return acc;
        },
        {} as Record<string, number>
      ),
      passed,
    });

    if (passed) {
      awardBadge(courseSlug, quiz.moduleId, `badge-${quiz.moduleId}`);
    }
    setUserProgress(getUserProgress(courseSlug));
  };

  const handleRetry = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers([]);
    setQuizCompleted(false);
    setScore(0);
    setShowExplanation(false);
  };

  const moduleProgress = userProgress.moduleProgress[quiz.moduleId];
  const previousAttempts = moduleProgress?.quizAttempts || [];
  const bestScore =
    previousAttempts.length > 0
      ? Math.max(...previousAttempts.map((a) => a.score))
      : 0;

  const progressPercent = Math.round(
    ((currentQuestionIndex + 1) / totalQuestions) * 100
  );
  const passed = score >= passingScore;

  return (
    <div className="min-h-screen bg-[#0F172A]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-900/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="text-2xl">🧪</div>
            <span className="font-fraunces text-lg font-bold text-white hidden sm:inline">
              Redditech Academy
            </span>
          </Link>
          <Link
            href={`/courses/${courseSlug}/learn/${moduleSlug}`}
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            ← Module
          </Link>
        </div>
      </header>

      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-slate-500 flex items-center gap-2 flex-wrap">
          <Link href={`/courses/${courseSlug}`} className="hover:text-white transition-colors">
            Course
          </Link>
          <span>/</span>
          <Link href={`/courses/${courseSlug}/learn/${moduleSlug}`} className="hover:text-white transition-colors">
            {quiz.moduleTitle}
          </Link>
          <span>/</span>
          <span className="text-slate-300">Quiz</span>
        </nav>

        {quizCompleted ? (
          /* Results view */
          <div className="space-y-6">
            <div className={`rounded-2xl border-2 p-8 text-center ${passed ? "border-green-500/50 bg-green-500/5" : "border-red-500/50 bg-red-500/5"}`}>
              <div className="text-6xl mb-4">{passed ? "🎉" : "📚"}</div>
              <h1 className="font-fraunces text-3xl font-bold text-white mb-2">
                {passed ? "You Passed!" : "Keep Learning!"}
              </h1>
              <p className="text-slate-300 text-lg mb-6">
                You scored {score}% ({selectedAnswers.filter((ans, idx) => ans === questions[idx].correctAnswer).length} of {totalQuestions} correct)
              </p>

              {/* Score bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-400">Your score</span>
                  <span className="text-white font-semibold">{score}%</span>
                </div>
                <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all rounded-full ${passed ? "bg-green-500" : "bg-red-500"}`}
                    style={{ width: `${score}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>0%</span>
                  <span>Passing: {passingScore}%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Badge earned */}
              {passed && (
                <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-6 mb-6">
                  <div className="text-5xl mb-2">{quiz.badgeIcon}</div>
                  <h3 className="font-fraunces text-xl font-bold text-white mb-1">
                    {quiz.badgeName}
                  </h3>
                  <p className="text-sm text-slate-400">{quiz.badgeDescription}</p>
                </div>
              )}

              {!passed && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 mb-6 text-sm text-slate-300">
                  You need {passingScore}% to pass. Review the lessons and try again!
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-3 justify-center">
                <button
                  onClick={handleRetry}
                  className="rounded-lg border border-slate-600 px-5 py-2.5 text-sm font-medium text-slate-300 hover:border-slate-500 hover:text-white transition-colors"
                >
                  Retry Quiz
                </button>
                <Link
                  href={`/courses/${courseSlug}/learn/${moduleSlug}`}
                  className="rounded-lg border border-slate-600 px-5 py-2.5 text-sm font-medium text-slate-300 hover:border-slate-500 hover:text-white transition-colors"
                >
                  Back to Module
                </Link>
                {passed && (
                  <Link
                    href={`/courses/${courseSlug}`}
                    className="rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-slate-900 hover:bg-orange-400 transition-colors"
                  >
                    Continue Course →
                  </Link>
                )}
              </div>
            </div>

            {/* Review answers */}
            <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
              <h2 className="font-fraunces text-xl font-bold text-white mb-6">
                Answer Review
              </h2>
              <div className="space-y-6">
                {questions.map((question, index) => {
                  const userAnswer = selectedAnswers[index];
                  const isCorrect = userAnswer === question.correctAnswer;
                  return (
                    <div key={index} className="pb-6 border-b border-slate-700 last:border-0">
                      <div className="flex items-start gap-3 mb-3">
                        <span className={`text-lg flex-shrink-0 ${isCorrect ? "text-green-400" : "text-red-400"}`}>
                          {isCorrect ? "✓" : "✗"}
                        </span>
                        <p className="font-semibold text-white">
                          {index + 1}. {question.question}
                        </p>
                      </div>
                      <div className="space-y-2 ml-8">
                        {question.options.map((option, optIndex) => {
                          const isUserAnswer = userAnswer === optIndex;
                          const isCorrectAnswer = question.correctAnswer === optIndex;
                          return (
                            <div
                              key={optIndex}
                              className={`p-3 rounded-lg border text-sm ${
                                isCorrectAnswer
                                  ? "border-green-500/50 bg-green-500/10 text-white"
                                  : isUserAnswer
                                  ? "border-red-500/50 bg-red-500/10 text-slate-300"
                                  : "border-slate-700 text-slate-400"
                              }`}
                            >
                              <span className="mr-2">
                                {isCorrectAnswer ? "✓" : isUserAnswer ? "✗" : "○"}
                              </span>
                              {option}
                            </div>
                          );
                        })}
                        {question.explanation && (
                          <div className="mt-3 p-3 bg-slate-700/50 rounded-lg text-sm text-slate-300">
                            <p className="font-semibold text-white mb-1">Explanation:</p>
                            {question.explanation}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* Quiz in progress */
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="font-fraunces text-2xl font-bold text-white">
                  {quiz.moduleTitle} — Quiz
                </h1>
                <p className="text-slate-400 text-sm mt-1">
                  Question {currentQuestionIndex + 1} of {totalQuestions}
                </p>
              </div>
              {bestScore > 0 && (
                <span className="rounded-full border border-slate-600 px-3 py-1 text-sm text-slate-400">
                  Best: {bestScore}%
                </span>
              )}
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-8">
              <div
                className="h-full bg-orange-500 transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Question */}
            <div className="rounded-xl border border-slate-700 bg-slate-800 p-6 sm:p-8">
              <h2 className="font-fraunces text-xl font-semibold text-white mb-6">
                {currentQuestion.question}
              </h2>

              {/* Options */}
              <div className="space-y-3 mb-6">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = selectedAnswers[currentQuestionIndex] === index;
                  const isCorrect = index === currentQuestion.correctAnswer;
                  const showResult = showExplanation;

                  return (
                    <button
                      key={index}
                      onClick={() => handleSelectAnswer(index)}
                      disabled={showExplanation}
                      className={`w-full p-4 text-left rounded-lg border-2 transition-all text-sm ${
                        showResult && isCorrect
                          ? "border-green-500 bg-green-500/10 text-white"
                          : showResult && isSelected && !isCorrect
                          ? "border-red-500 bg-red-500/10 text-white"
                          : isSelected
                          ? "border-orange-500 bg-orange-500/10 text-white"
                          : "border-slate-700 bg-slate-700/30 text-slate-300 hover:border-slate-500 hover:bg-slate-700"
                      } ${showExplanation ? "cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          showResult && isCorrect
                            ? "border-green-500 bg-green-500 text-white"
                            : showResult && isSelected && !isCorrect
                            ? "border-red-500 bg-red-500 text-white"
                            : isSelected
                            ? "border-orange-500 bg-orange-500 text-white"
                            : "border-slate-500"
                        }`}>
                          {showResult && isCorrect && "✓"}
                          {showResult && isSelected && !isCorrect && "✗"}
                          {!showResult && isSelected && "●"}
                        </div>
                        <span>{option}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Explanation */}
              {showExplanation && currentQuestion.explanation && (
                <div className="rounded-xl border border-orange-500/30 bg-orange-500/5 p-4 mb-6">
                  <p className="font-semibold text-white mb-1">Explanation:</p>
                  <p className="text-sm text-slate-300">{currentQuestion.explanation}</p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3">
                {!showExplanation ? (
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={selectedAnswers[currentQuestionIndex] === undefined}
                    className="flex-1 rounded-lg bg-orange-500 px-5 py-2.5 font-semibold text-slate-900 hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Submit Answer
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuestion}
                    className="flex-1 rounded-lg bg-orange-500 px-5 py-2.5 font-semibold text-slate-900 hover:bg-orange-400 transition-colors"
                  >
                    {currentQuestionIndex < totalQuestions - 1
                      ? "Next Question →"
                      : "Finish Quiz"}
                  </button>
                )}
              </div>
            </div>

            {/* Tips */}
            <div className="mt-6 rounded-xl border border-slate-700 bg-slate-800/50 p-4">
              <div className="flex items-start gap-3">
                <span className="text-xl">💡</span>
                <div className="text-sm">
                  <p className="font-semibold text-white mb-1">Quiz Tips</p>
                  <ul className="text-slate-400 space-y-1 list-disc list-inside">
                    <li>You need {passingScore}% to pass</li>
                    <li>You can retry as many times as needed</li>
                    <li>Review lessons if you&apos;re unsure</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
