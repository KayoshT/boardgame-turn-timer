import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog"
import { Spinner } from "./ui/spinner"


export default function ConnecttingModal({
    open,
}: { open: boolean }) {

    return (
        <Dialog open={open} >
            <DialogContent showClose={false} className="flex items-center justify-center w-fit">
                <Spinner size="md" />
                Connecting...
            </DialogContent>
        </Dialog>
    )
}
