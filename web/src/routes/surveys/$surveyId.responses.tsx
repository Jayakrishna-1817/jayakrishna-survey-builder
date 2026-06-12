import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useAuth } from '../../lib/auth'

export const Route = createFileRoute('/surveys/$surveyId/responses')({
  component: SurveyResponses,
})

function SurveyResponses() {
  const { surveyId } = Route.useParams()
  const { token } = useAuth()
  const navigate = useNavigate()

  const { data: survey, isLoading: surveyLoading } = useQuery({
    queryKey: ['survey', surveyId],
    queryFn: async () => {
      const res = await fetch(`/api/surveys/${surveyId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      return res.json()
    },
    enabled: !!token && !!surveyId,
  })

  const { data: responses, isLoading: responsesLoading } = useQuery({
    queryKey: ['responses', surveyId],
    queryFn: async () => {
      const res = await fetch(`/api/surveys/${surveyId}/responses`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      return res.json()
    },
    enabled: !!token && !!surveyId,
  })

  if (surveyLoading || responsesLoading) return <p>Loading...</p>

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            type="button"
            onClick={() => navigate({ to: '/' })}
            className="text-gray-600 hover:underline"
          >
            ← Back
          </button>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Responses for "{survey?.title}"</h1>
        {responses?.length === 0 ? (
          <p className="text-gray-600">No responses yet.</p>
        ) : (
          <div className="space-y-6">
            {responses?.map((response: any, index: number) => (
              <div key={response.id} className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="font-semibold mb-4">Response {index + 1}</h3>
                <div className="space-y-3">
                  {survey?.questions?.map((question: any) => (
                    <div
                      key={question.id}
                      className="border-l-4 pl-3"
                      style={{ borderColor: survey.primaryColor }}
                    >
                      <p className="font-medium text-sm">{question.title}</p>
                      <p className="text-gray-600">{response.answers[question.id] || '-'}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
