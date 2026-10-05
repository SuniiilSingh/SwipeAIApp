import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { api } from '@/services/api';
import { MicroCircle } from '@/types';
import { hapticFeedback } from '@/utils/haptics';

const { width } = Dimensions.get('window');

const INDIAN_CITIES = [
  'All Cities',
  'Bengaluru',
  'Mumbai',
  'Delhi NCR',
  'Gurgaon',
  'Noida',
  'Pune',
  'Hyderabad',
  'Goa',
  'Kolkata',
  'Chennai',
];

interface MicroCommunityModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (community: MicroCircle | null) => void;
  selectedName?: string | null;
  selectedId?: string | null;
  title?: string;
  subtitle?: string;
  initialCity?: string;
}

export default function MicroCommunityModal({
  visible,
  onClose,
  onSelect,
  selectedName,
  selectedId,
  title = 'Micro-Community Circles 🏙️',
  subtitle = 'Find matches in your neighborhood tribe & lifestyle subculture',
  initialCity,
}: MicroCommunityModalProps) {
  const [selectedCity, setSelectedCity] = useState<string>('All Cities');
  const [searchQuery, setSearchQuery] = useState('');
  const [communities, setCommunities] = useState<MicroCircle[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      if (initialCity && INDIAN_CITIES.includes(initialCity)) {
        setSelectedCity(initialCity);
      }
      loadCommunities(selectedCity === 'All Cities' ? undefined : selectedCity);
    }
  }, [visible, selectedCity]);

  const loadCommunities = async (city?: string) => {
    setLoading(true);
    try {
      const data = await api.getMicroCircles(city);
      setCommunities(data);
    } catch (e) {
      console.warn('Failed to load micro-communities:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCityChange = (city: string) => {
    hapticFeedback.selection();
    setSelectedCity(city);
  };

  const filteredCommunities = communities.filter((item) => {
    const matchesCity =
      selectedCity === 'All Cities' ||
      (item.city && item.city.toLowerCase() === selectedCity.toLowerCase());

    if (!matchesCity) return false;

    if (!searchQuery.trim()) return true;
    const query = searchQuery.trim().toLowerCase();
    const nameMatch = item.name.toLowerCase().includes(query);
    const tagMatch = item.tagline?.toLowerCase().includes(query);
    const descMatch = item.description?.toLowerCase().includes(query);
    const cityMatch = item.city?.toLowerCase().includes(query);
    return nameMatch || tagMatch || descMatch || cityMatch;
  });

  const handleSelectCommunity = (item: MicroCircle) => {
    hapticFeedback.success();
    onSelect(item);
    onClose();
  };

  const handleClear = () => {
    hapticFeedback.light();
    onSelect(null);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search neighborhood (e.g. Koramangala, Bandra, Hauz Khas)..."
            placeholderTextColor="#6B7082"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={{ color: '#8E94A5', fontSize: 13, fontWeight: '700' }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* City Filter Pills */}
        <View style={styles.cityPillsWrapper}>
          <FlatList
            horizontal
            data={INDIAN_CITIES}
            keyExtractor={(item) => item}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cityPillsScroll}
            renderItem={({ item }) => {
              const isActive = selectedCity === item;
              return (
                <TouchableOpacity
                  style={[styles.cityPill, isActive && styles.cityPillActive]}
                  onPress={() => handleCityChange(item)}>
                  <Text style={[styles.cityPillText, isActive && styles.cityPillTextActive]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        {/* Community List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#00E5FF" />
            <Text style={styles.loadingText}>Loading Indian Urban Circles...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredCommunities}
            keyExtractor={(item) => item.id || item.slug || item.name}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const isSelected =
                (selectedId && (item.id === selectedId || item.slug === selectedId)) ||
                (selectedName && item.name.toLowerCase() === selectedName.toLowerCase());

              return (
                <TouchableOpacity
                  style={[styles.card, isSelected && styles.cardSelected]}
                  activeOpacity={0.8}
                  onPress={() => handleSelectCommunity(item)}>
                  <View style={styles.badgeCircle}>
                    <Text style={styles.badgeIcon}>{item.badgeIcon || '🏙️'}</Text>
                  </View>

                  <View style={styles.cardContent}>
                    <View style={styles.cardHeaderRow}>
                      <Text style={[styles.cardTitle, isSelected && styles.cardTitleSelected]} numberOfLines={1}>
                        {item.name}
                      </Text>
                      {isSelected && (
                        <View style={styles.checkBadge}>
                          <Text style={styles.checkBadgeText}>✓ SELECTED</Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.cardTagline} numberOfLines={2}>
                      {item.tagline || item.description}
                    </Text>

                    <View style={styles.metaRow}>
                      {item.city && (
                        <View style={styles.metaPill}>
                          <Text style={styles.metaPillText}>📍 {item.city}</Text>
                        </View>
                      )}
                      {item.vibeCategory && (
                        <View style={[styles.metaPill, styles.vibePill]}>
                          <Text style={styles.vibePillText}>✨ {item.vibeCategory}</Text>
                        </View>
                      )}
                      {item.activeMembers ? (
                        <Text style={styles.membersCount}>
                          👥 {item.activeMembers.toLocaleString()} members
                        </Text>
                      ) : null}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyEmoji}>🏙️</Text>
                <Text style={styles.emptyTitle}>No Circles Found</Text>
                <Text style={styles.emptySubtitle}>
                  Try selecting "All Cities" or searching for a different neighborhood.
                </Text>
              </View>
            }
          />
        )}

        {/* Footer Actions */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
            <Text style={styles.clearBtnText}>Show All / No Circle Filter</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E0F13',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1F222A',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    color: '#8E94A5',
    fontSize: 12,
    marginTop: 3,
    lineHeight: 16,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#1C1E24',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181A20',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#262A34',
  },
  searchIcon: {
    fontSize: 15,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    padding: 0,
  },
  cityPillsWrapper: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1C23',
  },
  cityPillsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  cityPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#1A1C23',
    borderWidth: 1,
    borderColor: '#262A34',
  },
  cityPillActive: {
    backgroundColor: '#00E5FF',
    borderColor: '#00E5FF',
  },
  cityPillText: {
    color: '#8E94A5',
    fontSize: 12,
    fontWeight: '600',
  },
  cityPillTextActive: {
    color: '#08080E',
    fontWeight: '800',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#16181F',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#232733',
  },
  cardSelected: {
    borderColor: '#00E5FF',
    backgroundColor: '#10222D',
  },
  badgeCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#202430',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  badgeIcon: {
    fontSize: 22,
  },
  cardContent: {
    flex: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  cardTitleSelected: {
    color: '#00E5FF',
  },
  checkBadge: {
    backgroundColor: '#00E5FF',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  checkBadgeText: {
    color: '#08080E',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardTagline: {
    color: '#A0A6B8',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  metaPill: {
    backgroundColor: '#222530',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  metaPillText: {
    color: '#8E94A5',
    fontSize: 10,
    fontWeight: '600',
  },
  vibePill: {
    backgroundColor: '#2E2310',
  },
  vibePillText: {
    color: '#FFB800',
    fontSize: 10,
    fontWeight: '700',
  },
  membersCount: {
    color: '#6B7082',
    fontSize: 10,
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  loadingText: {
    color: '#8E94A5',
    fontSize: 13,
    marginTop: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtitle: {
    color: '#8E94A5',
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 240,
    lineHeight: 17,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#1F222A',
    backgroundColor: '#12141A',
  },
  clearBtn: {
    backgroundColor: '#1C1E26',
    borderWidth: 1,
    borderColor: '#2F3444',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  clearBtnText: {
    color: '#A0A6B8',
    fontSize: 13,
    fontWeight: '600',
  },
});
