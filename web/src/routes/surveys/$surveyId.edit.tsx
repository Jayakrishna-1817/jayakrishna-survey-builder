import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useAuth } from '../../lib/auth'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export const Route = createFileRoute('/surveys/$surveyId/edit')({
  component: SurveyEdit,
})

type Question = {
  id: string
  type: 'short_text' | 'multiple_choice' | 'rating'
  title: string
  options?: string[]
}

function SortableQuestionItem({
  question,
  removeQuestion,
  updateQuestion,
}: {
  question: Question
  removeQuestion: (id: string) => void
  updateQuestion: (id: string, updates: Partial<Question>) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: question.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 'auto',
  }

  return (
    <div ref={setNodeRef} style={style} className="border rounded-md p-4 bg-white">
      <div className="flex justify-between items-start mb-2">
        <div className="flex gap-2">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="text-gray-500 hover:text-gray-700 cursor-grab active:cursor-grabbing"
          >
            ⋮⋮
          </button>
        </div>
        <button
          type="button"
          onClick={() => removeQuestion(question.id)}
          className="text-red-600 hover:underline text-sm"
        >
          Remove
        </button>
      </div>
      <div className="space-y-3">
        <input
          type="text"
          value={question.title}
          onChange={(e) => updateQuestion(question.id, { title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Question title"
        />
        <span className="text-sm text-gray-500">Type: {question.type}</span>

        {question.type === 'multiple_choice' && (
          <div className="space-y-2">
            {question.options?.map((option, optIndex) => (
              <div key={optIndex} className="flex gap-2">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...(question.options || [])]
                    newOptions[optIndex] = e.target.value
                    updateQuestion(question.id, { options: newOptions })
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    const newOptions = (question.options || []).filter((_, i) => i !== optIndex)
                    updateQuestion(question.id, { options: newOptions })
                  }}
                  className="text-red-600 hover:underline"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                updateQuestion(question.id, {
                  options: [
                    ...(question.options || []),
                    `Option ${(question.options?.length || 0) + 1}`,
                  ],
                })
              }}
              className="text-blue-600 hover:underline text-sm"
            >
              + Add Option
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function SurveyEdit() {
  const { surveyId } = Route.useParams()
  const { token } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: survey, isLoading } = useQuery({
    queryKey: ['survey', surveyId],
    queryFn: async () => {
      const res = await fetch(`/api/surveys/${surveyId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      return res.json()
    },
    enabled: !!token && !!surveyId,
  })

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#3b82f6')
  const [logoUrl, setLogoUrl] = useState('')
  const [questions, setQuestions] = useState<Question[]>([])

  useEffect(() => {
    if (survey) {
      setTitle(survey.title)
      setDescription(survey.description)
      setPrimaryColor(survey.primaryColor)
      setLogoUrl(survey.logoUrl)
      setQuestions(survey.questions || [])
    }
  }, [survey])

  const addQuestion = (type: Question['type']) => {
    setQuestions([
      ...questions,
      {
        id: crypto.randomUUID(),
        type,
        title: 'New Question',
        options: type === 'multiple_choice' ? ['Option 1'] : undefined,
      },
    ])
  }

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id))
  }

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, ...updates } : q)))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setQuestions((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const saveMutation = useMutation({
    mutationFn: async () => {
      await fetch(`/api/surveys/${surveyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, description, primaryColor, logoUrl, questions }),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveys'] })
      queryClient.invalidateQueries({ queryKey: ['survey', surveyId] })
      navigate({ to: '/' })
    },
  })

  if (isLoading) return <p>Loading...</p>

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <button
            type="button"
            onClick={() => navigate({ to: '/' })}
            className="text-gray-600 hover:underline"
          >
            ← Back
          </button>
          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Survey Details</h2>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="survey-title"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Survey Name
              </label>
              <input
                id="survey-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label
                htmlFor="survey-description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Description
              </label>
              <textarea
                id="survey-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
            <div>
              <h3 className="text-md font-medium text-gray-700 mb-2">Brand Settings</h3>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label
                    htmlFor="primary-color"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Primary Color
                  </label>
                  <input
                    id="primary-color"
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-full h-10 rounded-md border border-gray-300"
                  />
                </div>
                <div className="flex-1">
                  <label
                    htmlFor="logo-url"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Logo URL
                  </label>
                  <input
                    id="logo-url"
                    type="url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/logo.png"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Questions</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => addQuestion('short_text')}
                className="px-3 py-1 border rounded-md hover:bg-gray-50"
              >
                Short Text
              </button>
              <button
                type="button"
                onClick={() => addQuestion('multiple_choice')}
                className="px-3 py-1 border rounded-md hover:bg-gray-50"
              >
                Multiple Choice
              </button>
              <button
                type="button"
                onClick={() => addQuestion('rating')}
                className="px-3 py-1 border rounded-md hover:bg-gray-50"
              >
                Rating
              </button>
            </div>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={questions.map((q) => q.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {questions.map((question) => (
                  <SortableQuestionItem
                    key={question.id}
                    question={question}
                    removeQuestion={removeQuestion}
                    updateQuestion={updateQuestion}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </main>
    </div>
  )
}
