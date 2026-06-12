import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useAuth } from '../lib/auth'

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  const { user, token, logout } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: surveys, isLoading } = useQuery({
    queryKey: ['surveys'],
    queryFn: async () => {
      const res = await fetch('/api/surveys', {
        headers: { Authorization: `Bearer ${token}` },
      })
      return res.json()
    },
    enabled: !!token,
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/surveys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: 'Untitled Survey',
          description: '',
          questions: [],
          primaryColor: '#3b82f6',
          logoUrl: '',
        }),
      })
      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['surveys'] })
      navigate({ to: '/surveys/$surveyId/edit', params: { surveyId: data.id } })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/surveys/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveys'] })
    },
  })

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold">Survey Builder</h1>
          <button type="button" onClick={() => logout()} className="text-gray-600 hover:underline">
            Logout
          </button>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">Welcome {user.email}</h2>
          <button
            type="button"
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {createMutation.isPending ? 'Creating...' : '+ Create Survey'}
          </button>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">My Surveys</h3>
          {isLoading ? (
            <p>Loading...</p>
          ) : surveys?.length === 0 ? (
            <p className="text-gray-500">No surveys yet. Create your first survey!</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {surveys?.map((survey: any) => (
                <div key={survey.id} className="bg-white p-6 rounded-lg shadow-sm border">
                  <h4 className="text-lg font-semibold mb-2">{survey.title}</h4>
                  <p className="text-gray-600 mb-4 text-sm">
                    {survey.description || 'No description'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        navigate({ to: '/surveys/$surveyId/edit', params: { surveyId: survey.id } })
                      }
                      className="text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        navigate({
                          to: '/surveys/$surveyId/responses',
                          params: { surveyId: survey.id },
                        })
                      }
                      className="text-green-600 hover:underline"
                    >
                      Responses
                    </button>
                    <button
                      type="button"
                      onClick={() => window.open(`/s/${survey.id}`, '_blank')}
                      className="text-purple-600 hover:underline"
                    >
                      Share
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          confirm(
                            'Are you sure you want to delete this survey? This will also delete all responses.',
                          )
                        ) {
                          deleteMutation.mutate(survey.id)
                        }
                      }}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
