import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, FlatList, View, Dimensions, Modal } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { UI_COLORS, TransactionType, THEME_PALETTES } from '@/src/utils/constants';
import { saveNote, getNoteByDate, appendNote, TransactionRecord, getTransactionsByMonth, clearAllData, getAllTransactions } from '@/src/db/DB';
import { saveThemeColor, getThemeColor, getLabels, saveLabels } from '@/src/db/SettingsManager';
import { parseTransactions } from '@/src/utils/parser';
import { IconSymbol } from '@/components/ui/icon-symbol';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TagSummary {
  tag: string;
  income: number;
  expense: number;
  balance: number;
}

interface MonthSummary {
  monthStr: string;
  displayMonth: string;
  income: number;
  expense: number;
  balance: number;
  tags: TagSummary[];
}

export default function MasterPagerScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [accentColor, setAccentColor] = useState(UI_COLORS.primary);
  const [labels, setLabels] = useState<string[]>([]);
  const [isLabelModalVisible, setIsLabelModalVisible] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  
  const [isWipeModalVisible, setIsWipeModalVisible] = useState(false);
  const [wipeCountdown, setWipeCountdown] = useState(3);

  const [tempAmount, setTempAmount] = useState('');
  const [tempDesc, setTempDesc] = useState('');
  const [fullNote, setFullNote] = useState('');
  const [transactions, setTransactions] = useState<Omit<TransactionRecord, 'id' | 'note_id' | 'dateStr'>[]>([]);
  const todayFull = new Date().toISOString().split('T')[0];
  const [year, month, day] = todayFull.split('-');
  const displayDate = `${day}.${month}.${year}`;

  const [monthData, setMonthData] = useState<TransactionRecord[]>([]);
  const [tagSummaryData, setTagSummaryData] = useState<TagSummary[]>([]);
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });
  const [allHistory, setAllHistory] = useState<MonthSummary[]>([]);
  const displayMonth = new Date().toLocaleString('tr-TR', { month: 'long', year: 'numeric' });

  const loadData = useCallback(async () => {
    const [color, storedLabels] = await Promise.all([getThemeColor(), getLabels()]);
    setAccentColor(color);
    setLabels(storedLabels);

    const monthStr = todayFull.slice(0, 7);
    const existingNote = await getNoteByDate(todayFull);
    if (existingNote) {
      setFullNote(existingNote.content);
      setTransactions(parseTransactions(existingNote.content));
    }
    
    const txs = await getTransactionsByMonth(monthStr);
    setMonthData(txs);
    let inc = 0, exp = 0;
    const tagMap: Record<string, { income: number; expense: number }> = {};

    txs.forEach(t => {
      if (t.type === TransactionType.INCOME) inc += t.amount;
      else exp += t.amount;

      const tagMatch = t.description.match(/#\w+/);
      const primaryTag = tagMatch ? tagMatch[0] : '#diğer';
      
      if (!tagMap[primaryTag]) tagMap[primaryTag] = { income: 0, expense: 0 };
      
      if (t.type === TransactionType.INCOME) {
        tagMap[primaryTag].income += t.amount;
      } else {
        tagMap[primaryTag].expense += t.amount;
      }
    });

    const formattedTagSummary = Object.keys(tagMap).map(tag => ({
      tag,
      income: tagMap[tag].income,
      expense: tagMap[tag].expense,
      balance: tagMap[tag].income - tagMap[tag].expense
    })).sort((a, b) => b.expense - a.expense);

    setTagSummaryData(formattedTagSummary);
    setSummary({ income: inc, expense: exp, balance: inc - exp });

    const allTxs = await getAllTransactions();
    const monthsMap: Record<string, { income: number; expense: number; tags: Record<string, { income: number; expense: number }> }> = {};

    allTxs.forEach(t => {
      const mStr = t.dateStr.slice(0, 7);
      if (!monthsMap[mStr]) monthsMap[mStr] = { income: 0, expense: 0, tags: {} };
      
      const tagMatch = t.description.match(/#\w+/);
      const primaryTag = tagMatch ? tagMatch[0] : '#diğer';
      if (!monthsMap[mStr].tags[primaryTag]) monthsMap[mStr].tags[primaryTag] = { income: 0, expense: 0 };

      if (t.type === TransactionType.INCOME) {
        monthsMap[mStr].income += t.amount;
        monthsMap[mStr].tags[primaryTag].income += t.amount;
      } else {
        monthsMap[mStr].expense += t.amount;
        monthsMap[mStr].tags[primaryTag].expense += t.amount;
      }
    });

    const formattedHistory: MonthSummary[] = Object.keys(monthsMap).sort((a, b) => b.localeCompare(a)).map(mStr => {
      const [y, m] = mStr.split('-');
      const dMonth = new Date(parseInt(y, 10), parseInt(m, 10) - 1).toLocaleString('tr-TR', { month: 'long', year: 'numeric' });
      
      const tags = Object.keys(monthsMap[mStr].tags).map(tag => ({
        tag,
        income: monthsMap[mStr].tags[tag].income,
        expense: monthsMap[mStr].tags[tag].expense,
        balance: monthsMap[mStr].tags[tag].income - monthsMap[mStr].tags[tag].expense
      })).sort((a, b) => b.expense - a.expense);

      return {
        monthStr: mStr,
        displayMonth: dMonth,
        income: monthsMap[mStr].income,
        expense: monthsMap[mStr].expense,
        balance: monthsMap[mStr].income - monthsMap[mStr].expense,
        tags
      };
    });

    setAllHistory(formattedHistory);
  }, [todayFull]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isWipeModalVisible && wipeCountdown > 0) {
      timer = setTimeout(() => setWipeCountdown(prev => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [isWipeModalVisible, wipeCountdown]);

  const openWipeModal = () => {
    setWipeCountdown(3);
    setIsWipeModalVisible(true);
  };

  const confirmWipe = async () => {
    await clearAllData();
    setIsWipeModalVisible(false);
    setFullNote('');
    setTransactions([]);
    loadData();
  };

  const handleManualAdd = async (type: 'gelir' | 'gider') => {
    if (!tempAmount.trim()) {
        Alert.alert('Eksik Bilgi', 'Lütfen miktar giriniz.');
        return;
    }
    
    const timeStr = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    const formattedEntry = `${timeStr} #${type} ${tempAmount.trim()} ${tempDesc.trim()}`;
    
    await appendNote(formattedEntry, todayFull);
    setTempAmount('');
    setTempDesc('');
    loadData();
  };

  const addTagToInput = (tag: string) => {
    const cleanTag = tag.startsWith('#') ? tag : `#${tag}`;
    if (!tempDesc.includes(cleanTag)) {
        setTempDesc(prev => prev.trim() ? `${prev} ${cleanTag}` : cleanTag);
    }
  };

  const addNewLabel = async () => {
    if (!newLabelName.trim()) return;
    const cleanName = newLabelName.trim().replace('#', '');
    if (!labels.includes(cleanName)) {
        const updated = [...labels, cleanName];
        setLabels(updated);
        await saveLabels(updated);
        setNewLabelName('');
    }
  };

  const removeLabel = async (label: string) => {
    const updated = labels.filter(l => l !== label);
    setLabels(updated);
    await saveLabels(updated);
  };

  const changeTheme = async (color: string) => {
    await saveThemeColor(color);
    setAccentColor(color);
  };

  const scrollTo = (index: number) => {
    scrollRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
    setActiveIndex(index);
  };

  const onScroll = (event: any) => {
    const x = event.nativeEvent.contentOffset.x;
    const index = Math.round(x / SCREEN_WIDTH);
    if (index !== activeIndex) setActiveIndex(index);
  };

  return (
    <ThemedView style={styles.masterContainer}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
      >
        {/* PAGE 1: JOURNAL */}
        <ThemedView style={[styles.page, { width: SCREEN_WIDTH }]}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <ThemedView style={styles.header}>
              <ThemedText type="title">Günlük ({displayDate})</ThemedText>
            </ThemedView>

            <ThemedView style={styles.listSection}>
              <FlatList
                data={transactions}
                keyExtractor={(_, i) => i.toString()}
                renderItem={({ item }) => (
                  <ThemedView style={styles.txRow}>
                    <ThemedView style={{ flex: 1 }}>
                      <ThemedText style={styles.txDesc}>
                        {item.time && <ThemedText style={[styles.timeTag, { color: accentColor }]}>{item.time} </ThemedText>}
                        {item.description || 'İşlem'}
                      </ThemedText>
                    </ThemedView>
                    <ThemedText style={[styles.txType, item.type === 'gelir' ? styles.income : styles.expense]}>
                      {item.type === 'gelir' ? '+' : '-'} {item.amount} TL
                    </ThemedText>
                  </ThemedView>
                )}
                ListEmptyComponent={<ThemedText style={styles.emptyText}>Henüz işlem yok.</ThemedText>}
              />
            </ThemedView>

            <ThemedView style={styles.formCard}>
              <View style={styles.tagStrip}>
                {labels.map((l) => (
                  <TouchableOpacity key={l} style={styles.tagChip} onPress={() => addTagToInput(l)}>
                    <ThemedText style={[styles.tagText, { color: accentColor }]}>#{l}</ThemedText>
                  </TouchableOpacity>
                ))}
              </View>

              <ThemedView style={styles.inputRow}>
                <TextInput 
                  style={[styles.input, styles.amountInput]} 
                  placeholder="0.00" 
                  placeholderTextColor={UI_COLORS.textSecondary} 
                  value={tempAmount} 
                  onChangeText={setTempAmount}
                  keyboardType="numeric"
                />
                <TextInput 
                  style={[styles.input, styles.descInput]} 
                  placeholder="Açıklama #etiket" 
                  placeholderTextColor={UI_COLORS.textSecondary} 
                  value={tempDesc} 
                  onChangeText={setTempDesc} 
                />
              </ThemedView>

              <ThemedView style={styles.buttonRow}>
                <TouchableOpacity style={[styles.actionButton, { backgroundColor: UI_COLORS.success }]} onPress={() => handleManualAdd('gelir')}><ThemedText style={styles.buttonText}>+ GELİR</ThemedText></TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, { backgroundColor: UI_COLORS.error }]} onPress={() => handleManualAdd('gider')}><ThemedText style={styles.buttonText}>- GİDER</ThemedText></TouchableOpacity>
              </ThemedView>
            </ThemedView>

            <ThemedView style={[styles.editorSection, { marginBottom: 100 }]}>
              <TextInput multiline style={styles.editor} value={fullNote} onChangeText={setFullNote} onBlur={() => saveNote(fullNote, todayFull)} />
            </ThemedView>
          </KeyboardAvoidingView>
        </ThemedView>

        {/* PAGE 2: SUMMARY */}
        <ThemedView style={[styles.page, { width: SCREEN_WIDTH }]}>
          <ThemedView style={styles.header}><ThemedText type="title">{displayMonth}</ThemedText></ThemedView>
          <ThemedView style={styles.cardContainer}>
            <ThemedView style={styles.balanceCard}>
              <ThemedText style={styles.cardLabel}>Net Bakiye</ThemedText>
              <ThemedText style={[styles.cardValue, summary.balance < 0 ? styles.expenseText : styles.incomeText]}>{summary.balance.toLocaleString('tr-TR')} ₺</ThemedText>
            </ThemedView>
            <ThemedView style={styles.statsRow}>
              <ThemedView style={[styles.statItem, styles.incomeCard]}><ThemedText style={styles.statLabel}>Gelir</ThemedText><ThemedText style={styles.statValue}>{summary.income} ₺</ThemedText></ThemedView>
              <ThemedView style={[styles.statItem, styles.expenseCard]}><ThemedText style={styles.statLabel}>Gider</ThemedText><ThemedText style={styles.statValue}>{summary.expense} ₺</ThemedText></ThemedView>
            </ThemedView>
          </ThemedView>
          <ThemedText type="subtitle" style={[styles.listHeader, { color: accentColor }]}>Etiketlere Göre Dağılım</ThemedText>
          <FlatList
            data={tagSummaryData}
            keyExtractor={(item) => item.tag}
            renderItem={({ item }) => (
              <ThemedView style={styles.tagSummaryCard}>
                <ThemedView style={styles.tagHeaderRow}>
                  <ThemedText style={[styles.tagSummaryTitle, { color: accentColor }]}>{item.tag}</ThemedText>
                  <ThemedText style={[styles.tagSummaryBalance, item.balance < 0 ? styles.expenseText : styles.incomeText]}>
                    Net: {item.balance > 0 ? '+' : ''}{item.balance} ₺
                  </ThemedText>
                </ThemedView>
                <ThemedView style={styles.tagStatsRow}>
                  <ThemedText style={styles.incomeText}>Gelir: +{item.income} ₺</ThemedText>
                  <ThemedText style={styles.expenseText}>Gider: -{item.expense} ₺</ThemedText>
                </ThemedView>
              </ThemedView>
            )}
            contentContainerStyle={{ paddingBottom: 150 }}
            ListEmptyComponent={<ThemedText style={styles.emptyText}>Henüz işlem yok.</ThemedText>}
          />
        </ThemedView>

        {/* PAGE 3: HISTORY */}
        <ThemedView style={[styles.page, { width: SCREEN_WIDTH }]}>
          <ThemedView style={styles.header}><ThemedText type="title">Geçmiş Aylar</ThemedText></ThemedView>
          <FlatList
            data={allHistory}
            keyExtractor={item => item.monthStr}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 150 }}
            renderItem={({ item }) => (
              <ThemedView style={styles.historyMonthCard}>
                <ThemedView style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                  <ThemedText style={{ fontSize: 20, fontWeight: 'bold', color: accentColor, textTransform: 'capitalize' }}>{item.displayMonth}</ThemedText>
                  <ThemedText style={[styles.cardValue, { fontSize: 20 }, item.balance < 0 ? styles.expenseText : styles.incomeText]}>
                    {item.balance > 0 ? '+' : ''}{item.balance.toLocaleString('tr-TR')} ₺
                  </ThemedText>
                </ThemedView>
                <ThemedView style={{ flexDirection: 'row', gap: 15, marginBottom: 15 }}>
                  <ThemedText style={styles.incomeText}>Gelir: {item.income.toLocaleString('tr-TR')} ₺</ThemedText>
                  <ThemedText style={styles.expenseText}>Gider: {item.expense.toLocaleString('tr-TR')} ₺</ThemedText>
                </ThemedView>
                
                {item.tags.map(t => (
                  <ThemedView key={t.tag} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: 0.5, borderTopColor: '#333' }}>
                    <ThemedText style={{ fontWeight: '500', color: '#CCC' }}>{t.tag}</ThemedText>
                    <ThemedText style={t.balance < 0 ? styles.expenseText : styles.incomeText}>
                      {t.balance > 0 ? '+' : ''}{t.balance} ₺
                    </ThemedText>
                  </ThemedView>
                ))}
              </ThemedView>
            )}
            ListEmptyComponent={<ThemedText style={styles.emptyText}>Geçmiş veri bulunamadı.</ThemedText>}
          />
        </ThemedView>

        {/* PAGE 4: MENU */}
        <ThemedView style={[styles.page, { width: SCREEN_WIDTH }]}>
          <ThemedView style={styles.header}><ThemedText type="title">Ayarlar</ThemedText></ThemedView>
          <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled={true}>
            <ThemedText style={styles.sectionTitle}>Renk Paleti</ThemedText>
            <FlatList
              data={THEME_PALETTES}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.name}
              contentContainerStyle={{ paddingBottom: 20, paddingRight: 50 }}
              renderItem={({ item: p }) => (
                <TouchableOpacity 
                    style={[styles.paletteItem, { borderColor: accentColor === p.color ? p.color : 'transparent' }]}
                    onPress={() => changeTheme(p.color)}
                >
                    <View style={[styles.paletteCircle, { backgroundColor: p.color }]} />
                    {accentColor === p.color && <View style={[styles.activeDot, { backgroundColor: p.color }]} />}
                </TouchableOpacity>
              )}
            />
            
            <ThemedText style={styles.sectionTitle}>Etiketler</ThemedText>
            <TouchableOpacity style={styles.menuPageItem} onPress={() => setIsLabelModalVisible(true)}>
                <IconSymbol name="plus" size={24} color={accentColor} />
                <ThemedText style={styles.menuPageText}>Etiketleri Yönet</ThemedText>
            </TouchableOpacity>

            <View style={[styles.previewCard, { borderColor: accentColor }]}>
                <ThemedText style={{ color: UI_COLORS.textSecondary, fontSize: 12 }}>Panel Görünümü</ThemedText>
                <ThemedText style={{ color: accentColor, fontSize: 24, fontWeight: 'bold', marginTop: 5 }}>Harcamalarım Legacy</ThemedText>
            </View>

            <TouchableOpacity style={[styles.menuPageItem, { borderColor: UI_COLORS.error, marginTop: 20 }]} onPress={openWipeModal}>
                <IconSymbol name="trash" size={24} color={UI_COLORS.error} />
                <ThemedText style={[styles.menuPageText, { color: UI_COLORS.error }]}>Bütün Bakiyeyi Sil</ThemedText>
            </TouchableOpacity>
          </ScrollView>
        </ThemedView>
      </ScrollView>

      {/* LABEL MANAGEMENT MODAL */}
      <Modal visible={isLabelModalVisible} animationType="slide" transparent>
        <ThemedView style={styles.modalOverlay}>
            <ThemedView style={styles.modalContent}>
                <ThemedView style={styles.modalHeader}>
                    <ThemedText type="subtitle">Etiketleri Yönet</ThemedText>
                    <TouchableOpacity onPress={() => setIsLabelModalVisible(false)}>
                        <IconSymbol name="calendar" size={24} color={accentColor} /> 
                    </TouchableOpacity>
                </ThemedView>

                <ThemedView style={styles.addLabelRow}>
                    <TextInput 
                        style={[styles.input, { flex: 1, marginBottom: 0 }]} 
                        placeholder="Yeni etiket..." 
                        placeholderTextColor="#666"
                        value={newLabelName}
                        onChangeText={setNewLabelName}
                    />
                    <TouchableOpacity style={[styles.addBtn, { backgroundColor: accentColor }]} onPress={addNewLabel}>
                        <ThemedText style={{ fontWeight: 'bold' }}>EKLE</ThemedText>
                    </TouchableOpacity>
                </ThemedView>

                <FlatList
                    data={labels}
                    keyExtractor={(item) => item}
                    renderItem={({ item }) => (
                        <ThemedView style={styles.labelItem}>
                            <ThemedText style={{ fontSize: 16 }}>#{item}</ThemedText>
                            <TouchableOpacity onPress={() => removeLabel(item)}>
                                <IconSymbol name="plus" size={20} color={UI_COLORS.error} />
                            </TouchableOpacity>
                        </ThemedView>
                    )}
                    style={{ maxHeight: 300 }}
                />
                
                <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setIsLabelModalVisible(false)}>
                    <ThemedText style={styles.buttonText}>KAPAT</ThemedText>
                </TouchableOpacity>
            </ThemedView>
        </ThemedView>
      </Modal>

      {/* WIPE CONFIRMATION MODAL */}
      <Modal visible={isWipeModalVisible} animationType="fade" transparent>
        <ThemedView style={styles.wipeModalOverlay}>
          <ThemedView style={styles.wipeModalContent}>
            <ThemedText type="subtitle" style={{ color: UI_COLORS.error, textAlign: 'center', marginBottom: 20 }}>DİKKAT</ThemedText>
            <ThemedText style={{ textAlign: 'center', fontSize: 18, marginBottom: 20 }}>
              Silmek istiyon mu cidden aq
            </ThemedText>
            
            {wipeCountdown > 0 ? (
              <ThemedText style={{ textAlign: 'center', fontSize: 48, fontWeight: 'bold', color: UI_COLORS.error }}>
                {wipeCountdown}
              </ThemedText>
            ) : (
              <ThemedView style={{ flexDirection: 'row', gap: 15, justifyContent: 'center' }}>
                <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#333' }]} onPress={() => setIsWipeModalVisible(false)}>
                  <ThemedText style={{ color: '#FFF', fontWeight: 'bold' }}>HAYIR</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, { backgroundColor: UI_COLORS.error }]} onPress={confirmWipe}>
                  <ThemedText style={{ color: '#FFF', fontWeight: 'bold' }}>EVET</ThemedText>
                </TouchableOpacity>
              </ThemedView>
            )}
          </ThemedView>
        </ThemedView>
      </Modal>

      {/* BOTTOM NAV BAR */}
      <ThemedView style={styles.bottomBar}>
        <TouchableOpacity style={styles.navItem} onPress={() => scrollTo(0)}>
          <IconSymbol name="pencil" size={28} color={activeIndex === 0 ? accentColor : "#666"} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => scrollTo(1)}>
          <IconSymbol name="chart.pie.fill" size={28} color={activeIndex === 1 ? accentColor : "#666"} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => scrollTo(2)}>
          <IconSymbol name="clock.fill" size={28} color={activeIndex === 2 ? accentColor : "#666"} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => scrollTo(3)}>
          <IconSymbol name="gearshape.fill" size={28} color={activeIndex === 3 ? accentColor : "#666"} />
        </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  masterContainer: { flex: 1, backgroundColor: UI_COLORS.background },
  page: { flex: 1, padding: 24, paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 30 },
  listSection: { flex: 1.2, backgroundColor: '#1A1A1A', borderRadius: 20, padding: 15, marginBottom: 15 },
  txRow: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#333', alignItems: 'center' },
  txType: { fontWeight: 'bold', fontSize: 16, width: 80 },
  txDesc: { flex: 1, color: UI_COLORS.text },
  timeTag: { fontWeight: 'bold', fontSize: 12 },
  income: { color: UI_COLORS.success },
  expense: { color: UI_COLORS.error },
  emptyText: { color: '#666', fontStyle: 'italic', textAlign: 'center', marginTop: 20 },
  formCard: { backgroundColor: '#222', borderRadius: 20, padding: 15, marginBottom: 15 },
  tagStrip: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12, paddingBottom: 5, gap: 8 },
  tagChip: { backgroundColor: '#111', borderRadius: 12, paddingHorizontal: 15, paddingVertical: 8, borderWidth: 1, borderColor: '#333' },
  tagText: { fontSize: 12, fontWeight: 'bold' },
  inputRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  amountInput: { flex: 0.3, textAlign: 'center' },
  descInput: { flex: 0.7 },
  input: { backgroundColor: '#111', borderRadius: 12, paddingHorizontal: 15, height: 50, color: '#FFF', borderWidth: 1, borderColor: '#333' },
  buttonRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  actionButton: { flex: 1, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: '#000', fontWeight: 'bold' },
  editorSection: { flex: 0.8 },
  editor: { flex: 1, backgroundColor: '#121212', borderRadius: 12, padding: 15, color: UI_COLORS.text, fontSize: 14, borderWidth: 1, borderColor: '#222', textAlignVertical: 'top' },
  cardContainer: { gap: 15, marginBottom: 20 },
  balanceCard: { backgroundColor: '#1E1E1E', borderRadius: 24, padding: 25, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  cardLabel: { color: '#888', fontSize: 14, marginBottom: 5 },
  cardValue: { fontSize: 36, fontWeight: 'bold' },
  statsRow: { flexDirection: 'row', gap: 15 },
  statItem: { flex: 1, borderRadius: 24, padding: 15, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  statLabel: { color: '#888', fontSize: 12, marginBottom: 2 },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  incomeCard: { backgroundColor: 'rgba(76, 175, 80, 0.1)' },
  expenseCard: { backgroundColor: 'rgba(244, 67, 54, 0.1)' },
  incomeText: { color: UI_COLORS.success },
  expenseText: { color: UI_COLORS.error },
  listHeader: { marginTop: 10, marginBottom: 15, color: UI_COLORS.primary },
  txItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 0.5, borderBottomColor: '#333' },
  txAmount: { fontSize: 16, fontWeight: 'bold' },
  txDate: { color: '#666', fontSize: 12 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#0A0A0A', paddingTop: 15, paddingBottom: Platform.OS === 'ios' ? 30 : 15, borderTopWidth: 0.5, borderTopColor: '#222' },
  navItem: { paddingHorizontal: 20, paddingVertical: 5 },
  sectionTitle: { color: '#888', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 15, letterSpacing: 1 },
  paletteItem: { width: 64, height: 64, backgroundColor: '#1A1A1A', borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginRight: 15, borderWidth: 2 },
  paletteCircle: { width: 44, height: 44, borderRadius: 22 },
  activeDot: { position: 'absolute', bottom: -12, width: 4, height: 4, borderRadius: 2 },
  menuPageItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', borderRadius: 16, padding: 20, marginBottom: 12, gap: 15, borderWidth: 1, borderColor: '#222' },
  menuPageText: { color: '#EEE', fontSize: 16, fontWeight: '500' },
  previewCard: { marginTop: 20, backgroundColor: '#1A1A1A', borderRadius: 20, padding: 20, borderWidth: 1, borderStyle: 'dotted' },
  
  tagSummaryCard: { backgroundColor: '#1A1A1A', borderRadius: 16, padding: 20, marginBottom: 12, borderWidth: 1, borderColor: '#222' },
  tagHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  tagSummaryTitle: { fontSize: 18, fontWeight: 'bold' },
  tagSummaryBalance: { fontSize: 14, fontWeight: 'bold' },
  tagStatsRow: { flexDirection: 'row', justifyContent: 'space-between' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#111', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, minHeight: 500 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  addLabelRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  addBtn: { width: 80, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  labelItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 0.5, borderBottomColor: '#222' },
  modalCloseBtn: { backgroundColor: '#FFF', height: 55, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 20 },

  wipeModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: 20 },
  wipeModalContent: { backgroundColor: '#1A1A1A', borderRadius: 24, padding: 30, borderWidth: 2, borderColor: UI_COLORS.error },
  
  historyMonthCard: { backgroundColor: '#1A1A1A', borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#222' },
});
