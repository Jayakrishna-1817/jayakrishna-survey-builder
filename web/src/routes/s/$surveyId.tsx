import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createFileRoute('/s/$surveyId')({
  component: PublicSurvey,
})

type Question = {
  id: string
  type: 'short_text' | 'multiple_choice' | 'rating'
  title: string
  options?: string[]
}

function PublicSurvey() {
  const { surveyId } = Route.useParams()
  const { data: survey, isLoading } = useQuery({
    queryKey: ['publicSurvey', surveyId],
    queryFn: async () => {
      const res = await fetch(`/api/public/surveys/${surveyId}`)
      return res.json()
    },
  })
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [submitted, setSubmitted] = useState(false)

  const submitMutation = useMutation({
    mutationFn: async () => {
      await fetch(`/api/public/surveys/${surveyId}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      })
    },
    onSuccess: () => setSubmitted(true),
  })

  if (isLoading)
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  if (!survey)
    return <div className="min-h-screen flex items-center justify-center">Survey not found</div>
  if (submitted)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Thank you!</h1>
          <p className="text-gray-600">Your response has been submitted.</p>
        </div>
      </div>
    )

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-8" style={{ backgroundColor: survey.primaryColor }}>
            {survey.logoUrl && (
              <img
                src={survey.logoUrl}
                alt="Logo"
                className="h-16 mb-4 object-contain bg-white rounded"
              />
            )}
            <h1 className="text-3xl font-bold text-white mb-2">{survey.title}</h1>
            {survey.description && <p className="text-white/90">{survey.description}</p>}
          </div>

          <div className="p-8 space-y-6">
            {survey.questions.map((question: Question) => (
              <div key={question.id} className="space-y-2">
                <label htmlFor={`q-${question.id}`} className="block font-medium">
                  {question.title}
                </label>
                {question.type === 'short_text' && (
                  <input
                    id={`q-${question.id}`}
                    type="text"
                    value={answers[question.id] || ''}
                    onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': survey.primaryColor } as React.CSSProperties}
                  />
                )}
                {question.type === 'multiple_choice' && (
                  <div className="space-y-2">
                    {question.options?.map((option, i) => (
                      <label key={i} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={question.id}
                          value={option}
                          checked={answers[question.id] === option}
                          onChange={(e) =>
                            setAnswers({ ...answers, [question.id]: e.target.value })
                          }
                          className="w-4 h-4"
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                )}
                {question.type === 'rating' && (
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setAnswers({ ...answers, [question.id]: num })}
                        className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${
                          answers[question.id] === num
                            ? 'border-transparent text-white'
                            : 'border-gray-300 text-gray-600 hover:border-gray-400'
                        }`}
                        style={{
                          backgroundColor:
                            answers[question.id] === num ? survey.primaryColor : 'transparent',
                        }}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <button
              onClick={() => submitMutation.mutate()}
              disabled={submitMutation.isPending}
              className="w-full py-3 text-white rounded-md font-medium disabled:opacity-50"
              style={{ backgroundColor: survey.primaryColor }}
            >
              {submitMutation.isPending ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
