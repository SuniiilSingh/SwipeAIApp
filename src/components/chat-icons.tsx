import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

export const PHONE_B64 =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNGRkZGRkYiIHN0cm9rZS13aWR0aD0iMi4yIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0yMiAxNi45MnYzYTIgMiAwIDAgMS0yLjE4IDIgMTkuNzkgMTkuNzkgMCAwIDEtOC42My0zLjA3IDE5LjUgMTkuNSAwIDAgMS02LTYgMTkuNzkgMTkuNzkgMCAwIDEtMy4wNy04LjY3QTIgMiAwIDAgMSA0LjExIDJoM2EyIDIgMCAwIDEgMiAxLjcyIDEyLjg0IDEyLjg0IDAgMCAwIC43IDIuODEgMiAyIDAgMCAxLS40NSAyLjExTDguMDkgOS45MWExNiAxNiAwIDAgMCA2IDZsMS4yNy0xLjI3YTIgMiAwIDAgMSAyLjExLS40NSAxMi44NCAxMi44NCAwIDAgMCAyLjgxLjdBMiAyIDAgMCAxIDIyIDE2LjkyeiIvPjwvc3ZnPg==';

export const VIDEO_B64 =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjRkZGRkZGIj48cG9seWdvbiBwb2ludHM9IjIzIDcgMTYgMTIgMjMgMTcgMjMgNyIvPjxyZWN0IHg9IjEiIHk9IjUiIHdpZHRoPSIxNSIgaGVpZ2h0PSIxNCIgcng9IjIuNSIgcnk9IjIuNSIvPjwvc3ZnPg==';

export const CAMERA_B64 =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNGRkZGRkYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMjMgMTlhMiAyIDAgMCAxLTIgMkgzYTIgMiAwIDAgMS0yLTJWOGEyIDIgMCAwIDEgMi0yaDRsMi0zaDZsMiAzaDRhMiAyIDAgMCAxIDIgMnoiLz48Y2lyY2xlIGN4PSIxMiIgY3k9IjEzIiByPSI0Ii8+PC9zdmc+';

export const SEND_B64 =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjRkZGRkZGIj48cGF0aCBkPSJNMi4wMSAyMUwyMyAxMiAyLjAxIDMgMiAxMGwxNSAyLTE1IDJ6Ii8+PC9zdmc+';

export const MIC_B64 =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNGRkZGRkYiIHN0cm9rZS13aWR0aD0iMi4yIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0xMiAxYTMgMyAwIDAgMC0zIDN2OGEzIDMgMCAwIDAgNiAwVjRhMyAzIDAgMCAwLTMtM3oiLz48cGF0aCBkPSJNMTkgMTB2MmE3IDcgMCAwIDEtMTQgMHYtMiIvPjxsaW5lIHgxPSIxMiIgeTE9IjE5IiB4Mj0iMTIiIHkyPSIyMyIvPjxsaW5lIHgxPSI4IiB5MT0iMjMiIHgyPSIxNiIgeTI9IjIzIi8+PC9zdmc+';

export const PLAY_B64 =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjRkZGRkZGIj48cG9seWdvbiBwb2ludHM9IjUgMyAxOSAxMiA1IDIxIDUgMyIvPjwvc3ZnPg==';

export const PAUSE_B64 =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjRkZGRkZGIj48cmVjdCB4PSI2IiB5PSI0IiB3aWR0aD0iNCIgaGVpZ2h0PSIxNiIvPjxyZWN0IHg9IjE0IiB5PSI0IiB3aWR0aD0iNCIgaGVpZ2h0PSIxNiIvPjwvc3ZnPg==';

export const GALLERY_B64 =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNGRkZGRkYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cmVjdCB4PSIzIiB5PSIzIiB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHJ4PSIyIiByeT0iMiIvPjxjaXJjbGUgY3g9IjguNSIgY3k9IjguNSIgcj0iMS41Ii8+PHBvbHlsaW5lIHBvaW50cz0iMjEgMTUgMTYgMTAgNSAyMSIvPjwvc3ZnPg==';

export const DOUBLE_TICK_B64 =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNGRkZGRkYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNNyAxMkwxMS41IDE2LjVMMjEgNyIvPjxwYXRoIGQ9Ik0zIDEyTDcuNSAxNi41TDEyIDExLjUiLz48L3N2Zz4=';

export const SINGLE_TICK_B64 =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNGRkZGRkYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNNCAxMkwxMCAxOEwyMCA2Ii8+PC9zdmc+';

interface IconProps {
  size?: number;
  color?: string;
}

export function AudioCallIcon({ size = 20, color = '#FF385C' }: IconProps) {
  return (
    <View style={[styles.center, { width: size, height: size }]}>
      <Image
        source={{ uri: PHONE_B64 }}
        style={{ width: size, height: size }}
        tintColor={color}
        contentFit="contain"
      />
    </View>
  );
}

export function VideoCallIcon({ size = 20, color = '#C084FC' }: IconProps) {
  return (
    <View style={[styles.center, { width: size, height: size }]}>
      <Image
        source={{ uri: VIDEO_B64 }}
        style={{ width: size, height: size }}
        tintColor={color}
        contentFit="contain"
      />
    </View>
  );
}

export function CameraIcon({ size = 20, color = '#9CA3AF' }: IconProps) {
  return (
    <View style={[styles.center, { width: size, height: size }]}>
      <Image
        source={{ uri: CAMERA_B64 }}
        style={{ width: size, height: size }}
        tintColor={color}
        contentFit="contain"
      />
    </View>
  );
}

export function GalleryIcon({ size = 20, color = '#9CA3AF' }: IconProps) {
  return (
    <View style={[styles.center, { width: size, height: size }]}>
      <Image
        source={{ uri: GALLERY_B64 }}
        style={{ width: size, height: size }}
        tintColor={color}
        contentFit="contain"
      />
    </View>
  );
}

export function SendIcon({ size = 18, color = '#FFFFFF' }: IconProps) {
  return (
    <View style={[styles.center, { width: size, height: size }]}>
      <Image
        source={{ uri: SEND_B64 }}
        style={{ width: size, height: size }}
        tintColor={color}
        contentFit="contain"
      />
    </View>
  );
}

export function MicIcon({ size = 20, color = '#9CA3AF' }: IconProps) {
  return (
    <View style={[styles.center, { width: size, height: size }]}>
      <Image
        source={{ uri: MIC_B64 }}
        style={{ width: size, height: size }}
        tintColor={color}
        contentFit="contain"
      />
    </View>
  );
}

export function PlayIcon({ size = 16, color = '#FFFFFF' }: IconProps) {
  return (
    <View style={[styles.center, { width: size, height: size }]}>
      <Image
        source={{ uri: PLAY_B64 }}
        style={{ width: size, height: size }}
        tintColor={color}
        contentFit="contain"
      />
    </View>
  );
}

export function PauseIcon({ size = 16, color = '#FFFFFF' }: IconProps) {
  return (
    <View style={[styles.center, { width: size, height: size }]}>
      <Image
        source={{ uri: PAUSE_B64 }}
        style={{ width: size, height: size }}
        tintColor={color}
        contentFit="contain"
      />
    </View>
  );
}

export function StatusTick({
  status,
  size = 15,
}: {
  status?: 'SENT' | 'DELIVERED' | 'READ';
  size?: number;
}) {
  const isRead = status === 'READ';
  const isDelivered = status === 'DELIVERED';
  const color = isRead ? '#A855F7' : isDelivered ? '#9CA3AF' : '#6B7280';
  const iconUri = isRead || isDelivered ? DOUBLE_TICK_B64 : SINGLE_TICK_B64;

  return (
    <View style={[styles.center, { width: size, height: size }]}>
      <Image
        source={{ uri: iconUri }}
        style={{ width: size, height: size }}
        tintColor={color}
        contentFit="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
