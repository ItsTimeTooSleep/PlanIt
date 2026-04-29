"use client";

import { useCallback, useEffect, useState } from "react";
import { useDesktopOnly, usePlatform } from "@/components/platform-provider";
import { SettingRow } from "@/components/settings/setting-row";
import { Switch } from "@/components/ui/switch";
import { useTranslations } from "@/lib/i18n";
import { useLanguage } from "@/lib/store";

interface AutoLaunchToggleProps {
	className?: string;
	disabled?: boolean;
}

/**
 * 开机自启开关组件
 * 仅在桌面端显示，允许用户配置应用开机自动启动
 * @param props.className - 自定义样式类名
 * @param props.disabled - 是否禁用
 */
export function AutoLaunchToggle({
	className,
	disabled,
}: AutoLaunchToggleProps) {
	const shouldRender = useDesktopOnly();
	const { api, isReady } = usePlatform();
	const lang = useLanguage();
	const t = useTranslations(lang);
	const [isEnabled, setIsEnabled] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		if (!api?.capabilities.supportsAutoLaunch) return;

		api
			.getAutoLaunch()
			.then(setIsEnabled)
			.catch(console.error)
			.finally(() => setIsLoading(false));
	}, [api]);

	const handleToggle = useCallback(
		async (checked: boolean) => {
			if (!api) return;

			setIsLoading(true);
			try {
				await api.setAutoLaunch({ enabled: checked, minimized: false });
				setIsEnabled(checked);
			} catch (error) {
				console.error("[AutoLaunchToggle] Failed to set auto launch:", error);
			} finally {
				setIsLoading(false);
			}
		},
		[api],
	);

	if (!shouldRender || !isReady) {
		return null;
	}

	return (
		<SettingRow
			label={t.settings.autoLaunch}
			description={t.settings.autoLaunchDesc}
			className={className}
		>
			<Switch
				checked={isEnabled}
				onCheckedChange={handleToggle}
				disabled={disabled || isLoading}
			/>
		</SettingRow>
	);
}
