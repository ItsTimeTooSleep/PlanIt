'use client'

import { useState, useEffect } from 'react'
import { UpdateDialog } from '@/components/update-dialog'
import { UpdaterManager } from '@/lib/updater'
import { useLanguage } from '@/lib/store'
import { useTranslations } from '@/lib/i18n'

interface UpdateProviderProps {
  children: React.ReactNode
}

export function UpdateProvider({ children }: UpdateProviderProps) {
  const lang = useLanguage()
  const t = useTranslations(lang)
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false)
  const [currentVersion, setCurrentVersion] = useState<string>('')
  const [currentBody, setCurrentBody] = useState<string | undefined>()
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    const updater = UpdaterManager.getInstance({
      updateAvailable: t.settings.updateAvailable,
      updateLatest: t.settings.updateLatest,
      updateError: t.settings.updateError,
      updateDownloading: t.settings.updateDownloading,
      updateInstalled: t.settings.updateInstalled,
      updateConfirmTitle: t.update.updateAvailable,
      updateConfirmBody: t.update.updateDesc,
    })

    updater.setOnUpdateAvailable((update) => {
      setCurrentVersion(update.version)
      setCurrentBody(update.body)
      setUpdateDialogOpen(true)
    })

    const checkDownloading = setInterval(() => {
      setIsDownloading(updater.getIsDownloading())
    }, 100)

    return () => {
      clearInterval(checkDownloading)
    }
  }, [lang, t.settings, t.update])

  const handleUpdateNow = async () => {
    const updater = UpdaterManager.getInstance()
    setIsDownloading(true)
    await updater.installUpdate()
  }

  const handleRemindLater = (skipThisVersion: boolean) => {
    const updater = UpdaterManager.getInstance()
    if (skipThisVersion && currentVersion) {
      updater.skipVersion(currentVersion)
    }
    setUpdateDialogOpen(false)
  }

  return (
    <>
      {children}
      <UpdateDialog
        open={updateDialogOpen}
        onOpenChange={setUpdateDialogOpen}
        version={currentVersion}
        body={currentBody}
        onUpdateNow={handleUpdateNow}
        onRemindLater={handleRemindLater}
        isDownloading={isDownloading}
      />
    </>
  )
}
