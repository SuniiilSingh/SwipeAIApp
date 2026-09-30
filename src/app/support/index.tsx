import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { api } from '@/services/api';
import { FaqItem, SupportTicket, TicketCategory, TicketStatus } from '@/types';
import { hapticFeedback } from '@/utils/haptics';

type SupportTab = 'FAQS' | 'RAISE_TICKET' | 'MY_TICKETS';

const CATEGORIES: { id: TicketCategory; label: string; icon: string }[] = [
  { id: 'PAYMENTS_BILLING', label: 'Payments & Billing', icon: '💳' },
  { id: 'PROFILE_VERIFICATION', label: 'Verification & KYC', icon: '🛡️' },
  { id: 'SAFETY_HARASSMENT', label: 'Safety & Report', icon: '🚨' },
  { id: 'MATCHES_CHAT', label: 'Matches & Chat', icon: '💬' },
  { id: 'APP_BUG', label: 'Technical Bug', icon: '🐛' },
  { id: 'OTHER', label: 'Other Concern', icon: '📝' },
];

export default function SupportScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SupportTab>('FAQS');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // FAQs state
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [selectedFaqCategory, setSelectedFaqCategory] = useState<string>('All');
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);

  // Tickets state
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<TicketCategory>('PAYMENTS_BILLING');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [faqList, ticketList] = await Promise.all([
        api.getFaqs(),
        api.getSupportTickets(),
      ]);
      setFaqs(faqList);
      setTickets(ticketList);
    } catch (err) {
      console.warn('Failed to load support data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleToggleFaq = (id: string) => {
    hapticFeedback.light();
    setExpandedFaqId((prev) => (prev === id ? null : id));
  };

  const handleSubmitTicket = async () => {
    if (!subject.trim()) {
      hapticFeedback.warning();
      Alert.alert('Subject Required', 'Please enter a brief subject for your concern.');
      return;
    }
    if (!description.trim()) {
      hapticFeedback.warning();
      Alert.alert('Details Required', 'Please describe your concern so our team can assist you.');
      return;
    }

    try {
      setSubmitting(true);
      hapticFeedback.medium();
      const newTicket = await api.createSupportTicket({
        category: selectedCategory,
        subject: subject.trim(),
        description: description.trim(),
      });

      setTickets((prev) => [newTicket, ...prev]);
      setSubject('');
      setDescription('');
      hapticFeedback.success();

      Alert.alert(
        'Ticket Created 🎉',
        `Your support request #${newTicket.ticketNumber} has been received. Our team will review your concern and update the status here.`,
        [
          {
            text: 'Track Ticket Status →',
            onPress: () => setActiveTab('MY_TICKETS'),
          },
        ]
      );
    } catch (err) {
      Alert.alert('Submission Error', 'Failed to submit ticket. Please check your network and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSimulateResolve = async (ticket: SupportTicket) => {
    try {
      setResolvingId(ticket.id);
      hapticFeedback.medium();
      const resolved = await api.resolveSupportTicket(
        ticket.id,
        `Issue #${ticket.ticketNumber} regarding "${ticket.subject}" has been verified and resolved by the Blunderr Support Team.`
      );
      setTickets((prev) => prev.map((t) => (t.id === ticket.id ? resolved : t)));
      hapticFeedback.success();
      Alert.alert('Status Updated ✅', `Ticket #${ticket.ticketNumber} is now marked as RESOLVED!`);
    } catch (e) {
      Alert.alert('Error', 'Could not update ticket status.');
    } finally {
      setResolvingId(null);
    }
  };

  const filteredFaqs = faqs.filter(
    (faq) => selectedFaqCategory === 'All' || faq.category === selectedFaqCategory
  );

  const faqCategories = ['All', ...Array.from(new Set(faqs.map((f) => f.category)))];

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          accessibilityLabel="Go back">
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <Text style={styles.headerSubtitle}>
          Frequently Asked Questions & Live Concern Resolution
        </Text>
      </View>

      {/* Segmented Navigation Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'FAQS' && styles.tabItemActive]}
          onPress={() => {
            hapticFeedback.selection();
            setActiveTab('FAQS');
          }}>
          <Text style={[styles.tabItemText, activeTab === 'FAQS' && styles.tabItemTextActive]}>
            ❓ FAQs
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'RAISE_TICKET' && styles.tabItemActive]}
          onPress={() => {
            hapticFeedback.selection();
            setActiveTab('RAISE_TICKET');
          }}>
          <Text
            style={[styles.tabItemText, activeTab === 'RAISE_TICKET' && styles.tabItemTextActive]}>
            🎫 Raise Ticket
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'MY_TICKETS' && styles.tabItemActive]}
          onPress={() => {
            hapticFeedback.selection();
            setActiveTab('MY_TICKETS');
          }}>
          <Text
            style={[styles.tabItemText, activeTab === 'MY_TICKETS' && styles.tabItemTextActive]}>
            📋 My Tickets ({tickets.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Loading Help & Support Hub...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#10B981"
            />
          }>
          {/* TAB 1: FAQs */}
          {activeTab === 'FAQS' && (
            <View>
              {/* Category Filters */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.faqFilterBar}
                contentContainerStyle={{ paddingRight: 16 }}>
                {faqCategories.map((cat) => {
                  const isSelected = selectedFaqCategory === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.faqCategoryChip, isSelected && styles.faqCategoryChipActive]}
                      onPress={() => {
                        hapticFeedback.selection();
                        setSelectedFaqCategory(cat);
                      }}>
                      <Text
                        style={[
                          styles.faqCategoryChipText,
                          isSelected && styles.faqCategoryChipTextActive,
                        ]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* FAQ Accordion List */}
              <View style={styles.faqList}>
                {filteredFaqs.map((faq) => {
                  const isExpanded = expandedFaqId === faq.id;
                  return (
                    <TouchableOpacity
                      key={faq.id}
                      style={[styles.faqCard, isExpanded && styles.faqCardExpanded]}
                      activeOpacity={0.8}
                      onPress={() => handleToggleFaq(faq.id)}>
                      <View style={styles.faqHeaderRow}>
                        <View style={{ flex: 1, paddingRight: 10 }}>
                          <Text style={styles.faqCategoryTag}>{faq.category}</Text>
                          <Text style={styles.faqQuestion}>{faq.question}</Text>
                        </View>
                        <Text style={styles.faqChevron}>{isExpanded ? '▲' : '▼'}</Text>
                      </View>

                      {isExpanded && (
                        <View style={styles.faqAnswerContainer}>
                          <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Raise Ticket Callout */}
              <View style={styles.raiseCalloutCard}>
                <Text style={styles.raiseCalloutTitle}>Still need assistance? 🤝</Text>
                <Text style={styles.raiseCalloutDesc}>
                  Our safety and support agents are available to address your specific concern.
                </Text>
                <TouchableOpacity
                  style={styles.raiseCalloutBtn}
                  activeOpacity={0.85}
                  onPress={() => {
                    hapticFeedback.selection();
                    setActiveTab('RAISE_TICKET');
                  }}>
                  <Text style={styles.raiseCalloutBtnText}>Raise a Support Ticket →</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* TAB 2: RAISE TICKET */}
          {activeTab === 'RAISE_TICKET' && (
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={{ width: '100%' }}>
              <View style={styles.ticketFormCard}>
                <Text style={styles.sectionHeading}>Tell Us What Happened</Text>
                <Text style={styles.sectionSub}>
                  Select a category and provide details so our team can resolve your concern promptly.
                </Text>

                {/* Category Selector Chips */}
                <Text style={styles.inputLabel}>CONCERN CATEGORY</Text>
                <View style={styles.categoryGrid}>
                  {CATEGORIES.map((cat) => {
                    const isSelected = selectedCategory === cat.id;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.categorySelectChip,
                          isSelected && styles.categorySelectChipActive,
                        ]}
                        activeOpacity={0.8}
                        onPress={() => {
                          hapticFeedback.selection();
                          setSelectedCategory(cat.id);
                        }}>
                        <Text style={styles.categoryChipIcon}>{cat.icon}</Text>
                        <Text
                          style={[
                            styles.categoryChipLabel,
                            isSelected && styles.categoryChipLabelActive,
                          ]}>
                          {cat.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Subject Input */}
                <Text style={styles.inputLabel}>SUBJECT</Text>
                <TextInput
                  style={styles.inputField}
                  placeholder="Brief summary (e.g., Payment query, Safety concern)"
                  placeholderTextColor="#60667A"
                  value={subject}
                  onChangeText={setSubject}
                  maxLength={100}
                />

                {/* Description Input */}
                <Text style={styles.inputLabel}>DETAILED DESCRIPTION</Text>
                <TextInput
                  style={[styles.inputField, styles.textAreaField]}
                  placeholder="Provide complete details, dates, transaction IDs, or usernames involved..."
                  placeholderTextColor="#60667A"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                />

                {/* Submit Action Button */}
                <TouchableOpacity
                  style={[styles.submitTicketBtn, submitting && styles.submitTicketBtnDisabled]}
                  activeOpacity={0.85}
                  onPress={handleSubmitTicket}
                  disabled={submitting}>
                  {submitting ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.submitTicketBtnText}>Submit Support Ticket 📨</Text>
                  )}
                </TouchableOpacity>

                <Text style={styles.slaNote}>
                  🔒 Tickets are prioritized by severity. Our support team typically responds within 2-4 hours.
                </Text>
              </View>
            </KeyboardAvoidingView>
          )}

          {/* TAB 3: MY TICKETS */}
          {activeTab === 'MY_TICKETS' && (
            <View>
              {tickets.length === 0 ? (
                <View style={styles.emptyTicketsBox}>
                  <Text style={styles.emptyTicketsIcon}>🎫</Text>
                  <Text style={styles.emptyTicketsTitle}>No Tickets Raised Yet</Text>
                  <Text style={styles.emptyTicketsDesc}>
                    If you encounter any issues with payments, safety, or verification, raise a ticket and track its status live here.
                  </Text>
                  <TouchableOpacity
                    style={styles.emptyRaiseBtn}
                    activeOpacity={0.85}
                    onPress={() => setActiveTab('RAISE_TICKET')}>
                    <Text style={styles.emptyRaiseBtnText}>Raise Your First Ticket →</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.ticketsList}>
                  {tickets.map((t) => {
                    const isPending = t.status === 'PENDING';
                    const isInProgress = t.status === 'IN_PROGRESS';
                    const isResolved = t.status === 'RESOLVED';
                    const catInfo = CATEGORIES.find((c) => c.id === t.category);

                    return (
                      <View
                        key={t.id}
                        style={[
                          styles.ticketCard,
                          isResolved && styles.ticketCardResolved,
                          isPending && styles.ticketCardPending,
                        ]}>
                        {/* Ticket Header */}
                        <View style={styles.ticketCardHeader}>
                          <View>
                            <Text style={styles.ticketNumber}>#{t.ticketNumber}</Text>
                            <Text style={styles.ticketDate}>
                              {new Date(t.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </Text>
                          </View>

                          {/* Status Badge */}
                          <View
                            style={[
                              styles.statusBadge,
                              isResolved && styles.statusBadgeResolved,
                              isPending && styles.statusBadgePending,
                              isInProgress && styles.statusBadgeInProgress,
                            ]}>
                            <Text
                              style={[
                                styles.statusBadgeText,
                                isResolved && styles.statusBadgeTextResolved,
                                isPending && styles.statusBadgeTextPending,
                                isInProgress && styles.statusBadgeTextInProgress,
                              ]}>
                              {isResolved
                                ? '🟢 RESOLVED'
                                : isInProgress
                                ? '🔵 IN PROGRESS'
                                : '🟡 PENDING'}
                            </Text>
                          </View>
                        </View>

                        {/* Category Tag */}
                        <View style={styles.ticketCategoryPill}>
                          <Text style={styles.ticketCategoryPillText}>
                            {catInfo ? `${catInfo.icon} ${catInfo.label}` : '📝 Other'}
                          </Text>
                        </View>

                        {/* Subject & Description */}
                        <Text style={styles.ticketSubject}>{t.subject}</Text>
                        <Text style={styles.ticketDescription}>{t.description}</Text>

                        {/* Resolution Notes Box */}
                        {isResolved && (
                          <View style={styles.resolutionBox}>
                            <Text style={styles.resolutionHeading}>✅ Resolution from Support Team:</Text>
                            <Text style={styles.resolutionNotes}>
                              {t.resolutionNotes ||
                                'Your concern has been resolved by our safety & payments support desk.'}
                            </Text>
                            {t.resolvedAt && (
                              <Text style={styles.resolvedAtText}>
                                Resolved on{' '}
                                {new Date(t.resolvedAt).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </Text>
                            )}
                          </View>
                        )}

                        {/* Testing Simulator (For immediate user testing of resolved state) */}
                        {isPending && (
                          <TouchableOpacity
                            style={styles.simulateResolveBtn}
                            onPress={() => handleSimulateResolve(t)}
                            disabled={resolvingId === t.id}>
                            {resolvingId === t.id ? (
                              <ActivityIndicator size="small" color="#10B981" />
                            ) : (
                              <Text style={styles.simulateResolveBtnText}>
                                ⚡ Simulate Team Resolution
                              </Text>
                            )}
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E0F14',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E212E',
  },
  backBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 2,
    marginBottom: 6,
  },
  backBtnText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '700',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    color: '#8E94A5',
    fontSize: 12,
    marginTop: 3,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: '#12141C',
    borderBottomWidth: 1,
    borderBottomColor: '#1E212E',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#181B26',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabItemActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    borderColor: '#10B981',
  },
  tabItemText: {
    color: '#8E94A5',
    fontSize: 11,
    fontWeight: '700',
  },
  tabItemTextActive: {
    color: '#10B981',
    fontWeight: '900',
  },
  scrollContent: {
    padding: 16,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#8E94A5',
    fontSize: 13,
    marginTop: 10,
    fontWeight: '600',
  },

  // FAQ STYLES
  faqFilterBar: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  faqCategoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#161824',
    borderWidth: 1,
    borderColor: '#262A3A',
    marginRight: 8,
  },
  faqCategoryChipActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  faqCategoryChipText: {
    color: '#8E94A5',
    fontSize: 11,
    fontWeight: '700',
  },
  faqCategoryChipTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  faqList: {
    gap: 10,
  },
  faqCard: {
    backgroundColor: '#141622',
    borderWidth: 1,
    borderColor: '#222638',
    borderRadius: 16,
    padding: 14,
  },
  faqCardExpanded: {
    borderColor: 'rgba(16, 185, 129, 0.5)',
    backgroundColor: '#161928',
  },
  faqHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqCategoryTag: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  faqQuestion: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
  },
  faqChevron: {
    color: '#8E94A5',
    fontSize: 12,
  },
  faqAnswerContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  faqAnswerText: {
    color: '#C3C8D8',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
  raiseCalloutCard: {
    marginTop: 20,
    backgroundColor: '#161928',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    textAlign: 'center',
  },
  raiseCalloutTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  raiseCalloutDesc: {
    color: '#8E94A5',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: 12,
  },
  raiseCalloutBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  raiseCalloutBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },

  // FORM STYLES
  ticketFormCard: {
    backgroundColor: '#141622',
    borderWidth: 1,
    borderColor: '#222638',
    borderRadius: 20,
    padding: 16,
  },
  sectionHeading: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '900',
  },
  sectionSub: {
    color: '#8E94A5',
    fontSize: 12,
    marginTop: 4,
    lineHeight: 17,
    marginBottom: 16,
  },
  inputLabel: {
    color: '#8E94A5',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categorySelectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#1A1D2B',
    borderWidth: 1,
    borderColor: '#2A2F45',
    gap: 6,
  },
  categorySelectChipActive: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
  },
  categoryChipIcon: {
    fontSize: 13,
  },
  categoryChipLabel: {
    color: '#8E94A5',
    fontSize: 11,
    fontWeight: '700',
  },
  categoryChipLabelActive: {
    color: '#10B981',
    fontWeight: '800',
  },
  inputField: {
    backgroundColor: '#1A1D2B',
    borderWidth: 1,
    borderColor: '#2A2F45',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 16,
  },
  textAreaField: {
    height: 120,
    paddingTop: 12,
  },
  submitTicketBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
      },
      default: {
        elevation: 4,
        shadowColor: '#10B981',
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 3 },
        shadowRadius: 6,
      },
    }),
  },
  submitTicketBtnDisabled: {
    opacity: 0.6,
  },
  submitTicketBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  slaNote: {
    color: '#656A7B',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 16,
  },

  // MY TICKETS STYLES
  emptyTicketsBox: {
    backgroundColor: '#141622',
    borderWidth: 1,
    borderColor: '#222638',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    textAlign: 'center',
    marginTop: 20,
  },
  emptyTicketsIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTicketsTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptyTicketsDesc: {
    color: '#8E94A5',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  emptyRaiseBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyRaiseBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  ticketsList: {
    gap: 12,
  },
  ticketCard: {
    backgroundColor: '#141622',
    borderWidth: 1.5,
    borderColor: '#222638',
    borderRadius: 18,
    padding: 16,
  },
  ticketCardPending: {
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  ticketCardResolved: {
    borderColor: 'rgba(16, 185, 129, 0.5)',
    backgroundColor: '#121820',
  },
  ticketCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  ticketNumber: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  ticketDate: {
    color: '#656A7B',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgePending: {
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  statusBadgeInProgress: {
    backgroundColor: 'rgba(59, 130, 246, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.4)',
  },
  statusBadgeResolved: {
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  statusBadgeTextPending: {
    color: '#F59E0B',
  },
  statusBadgeTextInProgress: {
    color: '#3B82F6',
  },
  statusBadgeTextResolved: {
    color: '#10B981',
  },
  ticketCategoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#1E2130',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8,
  },
  ticketCategoryPillText: {
    color: '#A0A6B8',
    fontSize: 11,
    fontWeight: '700',
  },
  ticketSubject: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  ticketDescription: {
    color: '#9096A8',
    fontSize: 12,
    lineHeight: 17,
  },
  resolutionBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  resolutionHeading: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 3,
  },
  resolutionNotes: {
    color: '#D1FAE5',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  resolvedAtText: {
    color: '#6EE7B7',
    fontSize: 10,
    marginTop: 6,
    fontWeight: '500',
  },
  simulateResolveBtn: {
    marginTop: 12,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 10,
  },
  simulateResolveBtnText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '800',
  },
});
