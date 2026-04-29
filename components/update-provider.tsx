"use client";

import { useEffect, useState } from "react";
import { useDesktopOnly } from "@/components/platform-provider";
import { UpdateDialog } from "@/components/update-dialog";
import { useTranslations } from "@/lib/i18n";
import { useLanguage } from "@/lib/store";
import { UpdaterManager } from "@/lib/updater";

interface UpdateProviderProps {
	children: React.ReactNode;
}

export function UpdateProvider({ children }: UpdateProviderProps) {
	const isDesktop = useDesktopOnly();
	const lang = useLanguage();
	const t = useTranslations(lang);
	const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
	const [currentVersion, setCurrentVersion] = useState<string>("");
	const [currentBody, setCurrentBody] = useState<string | undefined>();
	const [isDownloading, setIsDownloading] = useState(false);

	useEffect(() => {
		if (!isDesktop) return;

		const updater = UpdaterManager.getInstance({
			updateAvailable: t.settings.updateAvailable,
			updateLatest: t.settings.updateLatest,
			updateError: t.settings.updateError,
			updateDownloading: t.settings.updateDownloading,
			updateInstalled: t.settings.updateInstalled,
			updateConfirmTitle: t.update.updateAvailable,
			updateConfirmBody: t.update.updateDesc,
			updateChecking: t.settings.updateChecking,
			updateNetworkError: t.settings.updateNetworkError,
			updateTimeoutError: t.settings.updateTimeoutError,
		});

		updater.setOnUpdateAvailable((update) => {
			setCurrentVersion(update.version);
			setCurrentBody(update.body);
			setUpdateDialogOpen(true);
		});

		const checkDownloading = setInterval(() => {
			setIsDownloading(updater.getIsDownloading());
		}, 100);

		return () => {
			clearInterval(checkDownloading);
		};
	}, [t.settings, t.update, isDesktop]);

	const handleUpdateNow = async () => {
		if (!isDesktop) return;
		const updater = UpdaterManager.getInstance();
		setIsDownloading(true);
		await updater.installUpdate();
	};

	const handleRemindLater = (skipThisVersion: boolean) => {
		if (!isDesktop) return;
		const updater = UpdaterManager.getInstance();
		if (skipThisVersion && currentVersion) {
			updater.skipVersion(currentVersion);
		}
		setUpdateDialogOpen(false);
	};

	return (
		<>
			{children}
			{isDesktop && (
				<UpdateDialog
					open={updateDialogOpen}
					onOpenChange={setUpdateDialogOpen}
					version={currentVersion}
					body={currentBody}
					onUpdateNow={handleUpdateNow}
					onRemindLater={handleRemindLater}
					isDownloading={isDownloading}
				/>
			)}
		</>
	);
}
