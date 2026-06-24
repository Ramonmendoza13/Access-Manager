import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import apiClient from '../api/client';
import { useAuth } from '../store/authStore';
import type { RootStackParamList } from '../navigation/AppNavigator';

interface ActiveEvent {
  id: number;
  name: string;
  date: string;
  venue: string;
  active: boolean;
}

export default function HomeScreen() {
  const { email, logout } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [event, setEvent] = useState<ActiveEvent | null>(null);
  const [eventLoading, setEventLoading] = useState(true);
  const [eventError, setEventError] = useState(false);

  const fetchActiveEvent = useCallback(async () => {
    setEventLoading(true);
    setEventError(false);
    try {
      const { data } = await apiClient.get<ActiveEvent>('/api/events/active');
      setEvent(data);
    } catch {
      setEvent(null);
      setEventError(true);
    } finally {
      setEventLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveEvent();
  }, [fetchActiveEvent]);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Access Manager</Text>
        <Text style={styles.headerSubtitle}>{email}</Text>
      </View>

      {/* Main content */}
      <View style={styles.content}>

        {/* Scanner card */}
        <TouchableOpacity
          style={styles.scannerCard}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Scanner')}
        >
          <Text style={styles.scannerIcon}>📷</Text>
          <Text style={styles.scannerTitle}>Abrir Scanner</Text>
          <Text style={styles.scannerHint}>Toca para escanear entradas QR</Text>
        </TouchableOpacity>

        {/* Active event info card */}
        <View style={styles.eventCard}>
          <Text style={styles.eventCardTitle}>Evento activo</Text>

          {eventLoading ? (
            <ActivityIndicator color="#7c3aed" style={{ marginTop: 12 }} />
          ) : event ? (
            <View style={styles.eventInfo}>
              <Text style={styles.eventName}>{event.name}</Text>
              <View style={styles.eventRow}>
                <Text style={styles.eventLabel}>📅</Text>
                <Text style={styles.eventValue}>
                  {new Date(event.date).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              <View style={styles.eventRow}>
                <Text style={styles.eventLabel}>📍</Text>
                <Text style={styles.eventValue}>{event.venue}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.noEvent}>
              <Text style={styles.noEventText}>
                {eventError ? 'Sin evento activo' : 'No se pudo cargar'}
              </Text>
              <TouchableOpacity onPress={fetchActiveEvent}>
                <Text style={styles.retryText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Logout button */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
        activeOpacity={0.8}
      >
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#f1f5f9',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 28,
    gap: 20,
  },
  // ── Scanner card ──
  scannerCard: {
    backgroundColor: '#7c3aed',
    borderRadius: 20,
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  scannerIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  scannerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 6,
  },
  scannerHint: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  // ── Event card ──
  eventCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  eventCardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  eventInfo: {
    marginTop: 12,
  },
  eventName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 12,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  eventLabel: {
    fontSize: 14,
  },
  eventValue: {
    fontSize: 14,
    color: '#cbd5e1',
  },
  noEvent: {
    marginTop: 12,
    alignItems: 'center',
  },
  noEventText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  retryText: {
    fontSize: 13,
    color: '#7c3aed',
    fontWeight: '600',
    marginTop: 8,
  },
  // ── Logout ──
  logoutButton: {
    marginHorizontal: 24,
    marginBottom: 28,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: '600',
  },
});
