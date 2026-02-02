import { Sidebar } from '../components/Sidebar'
import { TodoPanel } from '../components/TodoPanel'

export default function TodoPage() {
    return (
        <>
            {/* 1. Category Navigation (Isolated Component) */}
            <Sidebar />

            {/* 2. Main Work Area (Isolated Component) */}
            <TodoPanel />
        </>
    )
}
