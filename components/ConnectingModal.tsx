import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog"
import { Spinner } from "./ui/spinner"


export default function ConnectingModal({
    open,
}: { open: boolean }) {

    return (
        <Dialog open={open} >
            <DialogContent showClose={false} className="flex items-center justify-center w-fit" style={{ borderRadius: "100px" }}>
                <Spinner size="md" />
                Connecting...
            </DialogContent>
        </Dialog>
    )
}
