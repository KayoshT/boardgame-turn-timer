import {
    Dialog,
    DialogTrigger,
    DialogContent,
} from "@/components/ui/dialog"
import { QRCodeCanvas } from "qrcode.react"
import { ReactNode, useState } from "react"

interface JoinRoomModalProps {
    roomCode: string | null
    children: ReactNode
}

export default function JoinRoomModal({
    roomCode,
    children,
}: JoinRoomModalProps) {
    const [open, setOpen] = useState(false)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>

            <DialogContent className="flex flex-col items-center justify-center p-10 gap-8">
                <QRCodeCanvas
                    value={`${process.env.NEXT_PUBLIC_APP_URL}/dune-imperium/controller?roomCode=${roomCode}`}
                    size={250}
                    bgColor="transparent"
                    fgColor="#4f3914"
                    level="M"
                />
                <p className="text-amber-900 font-medium">Scan the QR Code to join the room.</p>
            </DialogContent>
        </Dialog>
    )
}
