import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { educationAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const QuizPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [timeStarted, setTimeStarted] = useState(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchQuiz(slug);
    } else {
      fetchQuizList();
    }
  }, [slug]);

  useEffect(() => {
    let interval;
    if (timeStarted && score === null) {
      interval = setInterval(() => {
        setTimeElapsed(Math.floor((Date.now() - timeStarted) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timeStarted, score]);

  const fetchQuizList = async () => {
    try {
      setLoading(true);
      const response = await educationAPI.getContent({ content_type: 'quiz', language: 'vi' });
      const quizzes = response.data.data.content || [];
      
      if (quizzes.length > 0) {
        navigate(`/education/quiz/${quizzes[0].slug}`);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error('Failed to fetch quizzes:', err);
      setLoading(false);
    }
  };

  const fetchQuiz = async (quizSlug) => {
    try {
      setLoading(true);
      const response = await educationAPI.getContentBySlug(quizSlug);
      const quizData = response.data.data;
      
      if (quizData.content_type !== 'quiz') {
        navigate('/education');
        return;
      }

      setQuiz(quizData);
      
      // Parse quiz questions from content_body (JSON format)
      try {
        const parsedQuestions = typeof quizData.content_body === 'string' 
          ? JSON.parse(quizData.content_body) 
          : quizData.content_body;
        
        if (Array.isArray(parsedQuestions)) {
          setQuestions(parsedQuestions);
        } else if (parsedQuestions.questions) {
          setQuestions(parsedQuestions.questions);
        }
      } catch (e) {
        console.error('Failed to parse quiz questions:', e);
        // Create default questions if parsing fails
        setQuestions([
          {
            id: 1,
            question: 'Email từ ngân hàng yêu cầu bạn nhập mật khẩu là dấu hiệu của lừa đảo?',
            options: ['Đúng', 'Sai'],
            correct: 0,
            explanation: 'Đúng! Ngân hàng hợp pháp không bao giờ yêu cầu bạn nhập mật khẩu qua email.'
          }
        ]);
      }
      
      setTimeStarted(Date.now());
    } catch (err) {
      console.error('Failed to fetch quiz:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionId, answerIndex) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      submitQuiz();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const submitQuiz = async () => {
    setSubmitting(true);
    
    // Calculate score
    let correct = 0;
    questions.forEach((q, idx) => {
      if (answers[q.id || idx] === q.correct) {
        correct++;
      }
    });

    const finalScore = {
      correct,
      total: questions.length,
      percentage: Math.round((correct / questions.length) * 100),
      timeElapsed
    };

    setScore(finalScore);

    // Save attempt (works for both authenticated and anonymous users)
    if (quiz) {
      try {
        await educationAPI.submitQuizAttempt({
          content_id: quiz.content_id,
          score: correct,
          max_score: questions.length,
          time_taken_seconds: timeElapsed,
          answers: answers
        });
      } catch (err) {
        console.error('Failed to save quiz attempt:', err);
        // Don't show error to user - quiz still works without saving
      }
    }

    setSubmitting(false);
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setScore(null);
    setTimeStarted(Date.now());
    setTimeElapsed(0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-blue-200">Đang tải câu đố...</p>
        </div>
      </div>
    );
  }

  if (!quiz || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center bg-white/10 backdrop-blur-lg rounded-2xl p-12 border border-white/20 max-w-md mx-4">
          <span className="text-5xl mb-4 block">❓</span>
          <h1 className="text-2xl font-bold text-white mb-4">Không tìm thấy câu đố</h1>
          <Link
            to="/education"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-cyan-600 transition-all"
          >
            Quay lại trang giáo dục
          </Link>
        </div>
      </div>
    );
  }

  // Show results
  if (score !== null) {
    const scoreColor = score.percentage >= 80 ? 'text-emerald-400' : 
                      score.percentage >= 60 ? 'text-amber-400' : 'text-red-400';
    const scoreBg = score.percentage >= 80 ? 'bg-emerald-500/20' : 
                    score.percentage >= 60 ? 'bg-amber-500/20' : 'bg-red-500/20';

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 text-center">
            <div className={`w-32 h-32 rounded-full ${scoreBg} flex items-center justify-center mx-auto mb-6`}>
              <span className={`text-6xl font-bold ${scoreColor}`}>
                {score.percentage}%
              </span>
            </div>
            
            <h2 className="text-3xl font-bold text-white mb-4">
              {score.percentage >= 80 ? '🎉 Xuất sắc!' : 
               score.percentage >= 60 ? '👍 Tốt!' : '📚 Cần cải thiện'}
            </h2>
            
            <p className="text-blue-200/70 text-lg mb-6">
              Bạn đã trả lời đúng {score.correct} / {score.total} câu hỏi
            </p>
            
            <p className="text-blue-200/50 text-sm mb-8">
              Thời gian: {Math.floor(timeElapsed / 60)}:{(timeElapsed % 60).toString().padStart(2, '0')}
            </p>

            {/* Review Answers */}
            <div className="mt-8 text-left space-y-4">
              <h3 className="text-xl font-bold text-white mb-4">Xem lại câu trả lời:</h3>
              {questions.map((q, idx) => {
                const userAnswer = answers[q.id || idx];
                const isCorrect = userAnswer === q.correct;
                
                return (
                  <div
                    key={q.id || idx}
                    className={`p-4 rounded-xl ${
                      isCorrect ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-red-500/10 border border-red-500/30'
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-2">
                      <span className={isCorrect ? 'text-emerald-400' : 'text-red-400'}>
                        {isCorrect ? '✅' : '❌'}
                      </span>
                      <div className="flex-1">
                        <p className="text-white font-medium mb-2">{q.question}</p>
                        <p className="text-blue-200/70 text-sm">
                          Đáp án đúng: <span className="text-emerald-400 font-medium">{q.options[q.correct]}</span>
                        </p>
                        {userAnswer !== undefined && (
                          <p className="text-blue-200/70 text-sm">
                            Bạn chọn: <span className="text-blue-200 font-medium">{q.options[userAnswer]}</span>
                          </p>
                        )}
                        {q.explanation && (
                          <p className="text-blue-200/80 text-sm mt-2 italic">
                            💡 {q.explanation}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 flex gap-4 justify-center">
              <button
                onClick={resetQuiz}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-all"
              >
                Làm lại
              </button>
              <Link
                to="/education"
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-cyan-600 transition-all"
              >
                Xem thêm tài liệu
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show quiz questions
  const question = questions[currentQuestion];
  const userAnswer = answers[question.id || currentQuestion];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Header */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-white">{quiz.title}</h1>
            <div className="text-blue-200/70 text-sm">
              ⏱️ {Math.floor(timeElapsed / 60)}:{(timeElapsed % 60).toString().padStart(2, '0')}
            </div>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            />
          </div>
          <p className="text-blue-200/70 text-sm mt-2">
            Câu hỏi {currentQuestion + 1} / {questions.length}
          </p>
        </div>

        {/* Question Card */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 mb-6 border border-white/10">
          <h2 className="text-2xl font-bold text-white mb-6">{question.question}</h2>
          
          <div className="space-y-3">
            {question.options.map((option, idx) => {
              const isSelected = userAnswer === idx;
              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(question.id || currentQuestion, idx)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'bg-cyan-500/20 border-cyan-400 text-white'
                      : 'bg-white/5 border-white/10 text-blue-200 hover:bg-white/10 hover:border-cyan-400/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? 'border-cyan-400 bg-cyan-400' : 'border-white/30'
                    }`}>
                      {isSelected && <div className="w-3 h-3 rounded-full bg-white" />}
                    </div>
                    <span className="font-medium">{option}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Câu trước
          </button>
          <button
            onClick={handleNext}
            disabled={userAnswer === undefined}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {currentQuestion === questions.length - 1 ? 'Nộp bài' : 'Câu tiếp →'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizPage;
