import { TimeTableDisplay } from "@/components/timetable/display"

type TimeTablePageProps = {
  params: {
    id: string
  }
}

export default function TimeTablePage({ params }: TimeTablePageProps) {
  return (
    <main className="min-h-screen w-full bg-background text-foreground p-4">
      <TimeTableDisplay id={params.id} />
    </main>
  )
}
