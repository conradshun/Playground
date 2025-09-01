import { CreateSetForm } from "@/components/create-set-form"

export default function CreatePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Create New Flashcard Set</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Start by giving your flashcard set a title and description
            </p>
          </div>
          <CreateSetForm />
        </div>
      </div>
    </div>
  )
}
