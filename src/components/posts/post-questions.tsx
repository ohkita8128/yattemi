'use client';

import { useState } from 'react';
import { usePostQuestions } from '@/hooks/use-post-questions';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import { MessageCircleQuestion, Send, Trash2, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ReportDialog } from '@/components/common/report-dialog';

interface PostQuestionsProps {
  postId: string;
  postOwnerId: string;
  currentUserId: string | null;
  isClosed: boolean;
}

export function PostQuestions({
  postId,
  postOwnerId,
  currentUserId,
  isClosed,
}: PostQuestionsProps) {
  const { questions, isLoading, submitQuestion, submitAnswer, updateAnswer, deleteQuestion } =
    usePostQuestions(postId);
  const [newQuestion, setNewQuestion] = useState('');
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingAnswerId, setEditingAnswerId] = useState<string | null>(null);
  const [editAnswerText, setEditAnswerText] = useState('');
  const [reportTargetId, setReportTargetId] = useState<string | null>(null);

  const isPostOwner = currentUserId === postOwnerId;

  const handleSubmitQuestion = async () => {
    if (!currentUserId || !newQuestion.trim() || newQuestion.length > 400) return;

    setIsSubmitting(true);
    try {
      await submitQuestion(newQuestion.trim(), currentUserId);
      setNewQuestion('');
    } catch (err) {
      console.error('質問の投稿に失敗しました', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitAnswer = async (questionId: string) => {
    if (!answerText.trim()) return;

    setIsSubmitting(true);
    try {
      await submitAnswer(questionId, answerText.trim());
      setAnsweringId(null);
      setAnswerText('');
    } catch (err) {
      console.error('回答の投稿に失敗しました', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (questionId: string, questionUserId: string, createdAt: string) => {
    // 質問者は10分以内のみ削除可能
    if (questionUserId === currentUserId) {
      const createdTime = new Date(createdAt).getTime();
      const now = Date.now();
      const tenMinutes = 10 * 60 * 1000;
      if (now - createdTime > tenMinutes) {
        alert('投稿から10分以上経過しているため削除できません');
        return;
      }
    }

    if (!confirm('この質問を削除しますか？')) return;

    try {
      await deleteQuestion(questionId);
    } catch (err) {
      console.error('削除に失敗しました', err);
    }
  };

  const canDelete = (questionUserId: string, createdAt: string) => {
    if (!currentUserId) return false;
    if (isPostOwner) return true;
    if (questionUserId === currentUserId) {
      const createdTime = new Date(createdAt).getTime();
      const now = Date.now();
      const tenMinutes = 10 * 60 * 1000;
      return now - createdTime <= tenMinutes;
    }
    return false;
  };

  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <MessageCircleQuestion className="w-5 h-5" />
        投稿者への質問 ({questions.length})
      </h2>

      {/* 注意文 */}
      <p className="text-sm text-muted-foreground mb-4">
        ※すべての質問・回答は公開されます。個人情報・連絡先の投稿は禁止です。
      </p>

      {/* 質問投稿フォーム */}
      {currentUserId && !isClosed && (
        <div className="mb-6 space-y-2">
          <Textarea
            placeholder="質問を入力（最大400文字）"
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            maxLength={400}
            rows={3}
          />
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {newQuestion.length}/400
            </span>
            <Button
              onClick={handleSubmitQuestion}
              disabled={!newQuestion.trim() || isSubmitting}
              size="sm"
            >
              <Send className="w-4 h-4 mr-1" />
              質問する
            </Button>
          </div>
        </div>
      )}

      {isClosed && (
        <p className="text-sm text-muted-foreground mb-4">
          この投稿は締め切られているため、新規質問はできません。
        </p>
      )}

      {!currentUserId && (
        <p className="text-sm text-muted-foreground mb-4">
          質問するにはログインしてください。
        </p>
      )}

      {/* 質問一覧 */}
      {isLoading ? (
        <p className="text-muted-foreground">読み込み中...</p>
      ) : questions.length === 0 ? (
        <p className="text-muted-foreground">まだ質問はありません</p>
      ) : (
        <div className="space-y-4">
          {questions.map((q) => (
            <div key={q.id} className="border rounded-lg p-4">
              {/* 質問 */}
              <div className="flex items-start gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={q.profiles?.avatar_url || ''} />
                  <AvatarFallback>
                    {q.profiles?.display_name?.[0] || q.profiles?.username?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">
                      {q.profiles?.display_name || q.profiles?.username}
                    </span>
                    <span className="text-muted-foreground">
                      {formatDistanceToNow(new Date(q.created_at), {
                        addSuffix: true,
                        locale: ja,
                      })}
                    </span>
                    <div className="flex items-center gap-2 ml-auto">
                      {/* 通報ボタン（自分の質問以外） */}
                      {currentUserId && q.user_id !== currentUserId && (
                        <button
                          onClick={() => setReportTargetId(q.id)}
                          className="text-muted-foreground hover:text-red-500"
                          title="通報"
                        >
                          <Flag className="w-4 h-4" />
                        </button>
                      )}
                      {/* 削除ボタン */}
                      {canDelete(q.user_id, q.created_at) && (
                        <button
                          onClick={() => handleDelete(q.id, q.user_id, q.created_at)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap">{q.question_text}</p>
                </div>
              </div>

              {/* 回答 */}
              {q.answer_text ? (
                <div className="mt-4 ml-11 pl-4 border-l-2 border-primary/30">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-primary">投稿者の回答</p>
                    {isPostOwner && !isClosed && (
                      <button
                        onClick={() => {
                          setEditingAnswerId(q.id);
                          setEditAnswerText(q.answer_text || '');
                        }}
                        className="text-xs text-gray-400 hover:text-gray-600"
                      >
                        編集
                      </button>
                    )}
                  </div>
                  {editingAnswerId === q.id ? (
                    <div className="mt-2 space-y-2">
                      <Textarea
                        value={editAnswerText}
                        onChange={(e) => setEditAnswerText(e.target.value)}
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={async () => {
                            if (!editAnswerText.trim()) return;
                            setIsSubmitting(true);
                            try {
                              await updateAnswer(q.id, editAnswerText.trim());
                              setEditingAnswerId(null);
                              setEditAnswerText('');
                            } catch (err) {
                              console.error('回答の更新に失敗しました', err);
                            } finally {
                              setIsSubmitting(false);
                            }
                          }}
                          disabled={!editAnswerText.trim() || isSubmitting}
                        >
                          更新
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingAnswerId(null);
                            setEditAnswerText('');
                          }}
                        >
                          キャンセル
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-1 whitespace-pre-wrap">{q.answer_text}</p>
                  )}
                </div>
              ) : isPostOwner && !isClosed ? (
                <div className="mt-4 ml-11">
                  {answeringId === q.id ? (
                    <div className="space-y-2">
                      <Textarea
                        placeholder="回答を入力"
                        value={answerText}
                        onChange={(e) => setAnswerText(e.target.value)}
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSubmitAnswer(q.id)}
                          disabled={!answerText.trim() || isSubmitting}
                        >
                          回答する
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setAnsweringId(null);
                            setAnswerText('');
                          }}
                        >
                          キャンセル
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setAnsweringId(q.id)}
                    >
                      回答する
                    </Button>
                  )}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
      {/* Report Dialog */}
      <ReportDialog
        isOpen={!!reportTargetId}
        onClose={() => setReportTargetId(null)}
        type="question"
        targetId={reportTargetId || ''}
      />
    </div>
  );
}