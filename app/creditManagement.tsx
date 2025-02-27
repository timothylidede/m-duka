// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   TextInput,
//   Modal,
//   ScrollView,
//   Alert,
//   SafeAreaView,
//   StatusBar,
//   FlatList,
//   ActivityIndicator
// } from 'react-native';
// import { FontAwesome } from '@expo/vector-icons';
// import { format, parseISO, addDays, isBefore, isAfter } from 'date-fns';

// // Types
// interface DebtRecord {
//   id: string;
//   name: string;
//   company: string;
//   amount: number;
//   dueDate: string;
//   createdDate: string;
//   notes: string;
//   status: 'pending' | 'partial' | 'paid' | 'overdue';
//   type: 'receivable' | 'payable';
//   contactInfo: string;
//   paymentHistory: PaymentRecord[];
// }

// interface PaymentRecord {
//   id: string;
//   date: string;
//   amount: number;
//   method: string;
//   notes: string;
// }

// type SortField = 'name' | 'amount' | 'dueDate';
// type SortOrder = 'asc' | 'desc';

// interface FilterOptions {
//   status: string;
//   searchQuery: string;
//   dateRange: string;
// }

// // Sample Data
// const generateSampleData = (): DebtRecord[] => {
//   return [
//     // Accounts Receivable (Money owed TO your business)
//     {
//       id: 'r1',
//       name: 'John Smith',
//       company: 'Smith Enterprises',
//       amount: 5000,
//       dueDate: '2025-03-15',
//       createdDate: '2025-02-01',
//       notes: 'For consulting services provided in January',
//       status: 'pending',
//       type: 'receivable',
//       contactInfo: 'john@smithenterprises.com | (555) 123-4567',
//       paymentHistory: [
//         {
//           id: 'p1',
//           date: '2025-02-10',
//           amount: 1000,
//           method: 'Bank Transfer',
//           notes: 'First installment'
//         }
//       ]
//     },
//     {
//       id: 'r2',
//       name: 'Sarah Johnson',
//       company: 'Johnson Retail',
//       amount: 3200,
//       dueDate: '2025-02-20',
//       createdDate: '2025-01-15',
//       notes: 'Outstanding invoice #INV-2025-01-15',
//       status: 'overdue',
//       type: 'receivable',
//       contactInfo: 'sarah@johnsonretail.com | (555) 987-6543',
//       paymentHistory: []
//     },
//     {
//       id: 'r3',
//       name: 'Pacific Tech Solutions',
//       company: 'Pacific Tech Solutions',
//       amount: 12500,
//       dueDate: '2025-04-01',
//       createdDate: '2025-02-15',
//       notes: 'Project completion payment',
//       status: 'pending',
//       type: 'receivable',
//       contactInfo: 'accounts@pacifictech.com | (555) 444-3333',
//       paymentHistory: [
//         {
//           id: 'p2',
//           date: '2025-02-15',
//           amount: 6250,
//           method: 'Credit Card',
//           notes: '50% down payment'
//         }
//       ]
//     },
//     {
//       id: 'r4',
//       name: 'David Williams',
//       company: 'Williams Construction',
//       amount: 7800,
//       dueDate: '2025-03-10',
//       createdDate: '2025-01-25',
//       notes: 'Material supplies for project #WC-2025-112',
//       status: 'partial',
//       type: 'receivable',
//       contactInfo: 'david@williamsconstruction.com | (555) 222-1111',
//       paymentHistory: [
//         {
//           id: 'p3',
//           date: '2025-02-10',
//           amount: 3000,
//           method: 'Check',
//           notes: 'Partial payment'
//         }
//       ]
//     },
    
//     // Accounts Payable (Money your business owes)
//     {
//       id: 'p1',
//       name: 'Office Supply Co.',
//       company: 'Office Supply Co.',
//       amount: 1250,
//       dueDate: '2025-03-05',
//       createdDate: '2025-02-05',
//       notes: 'Monthly office supplies',
//       status: 'pending',
//       type: 'payable',
//       contactInfo: 'billing@officesupply.com | (555) 777-8888',
//       paymentHistory: []
//     },
//     {
//       id: 'p2',
//       name: 'Global Shipping LLC',
//       company: 'Global Shipping LLC',
//       amount: 3450,
//       dueDate: '2025-02-25',
//       createdDate: '2025-02-10',
//       notes: 'Shipping services for February',
//       status: 'pending',
//       type: 'payable',
//       contactInfo: 'accounts@globalshipping.com | (555) 999-0000',
//       paymentHistory: []
//     },
//     {
//       id: 'p3',
//       name: 'Tech Equipment Inc.',
//       company: 'Tech Equipment Inc.',
//       amount: 8900,
//       dueDate: '2025-02-15',
//       createdDate: '2025-01-15',
//       notes: 'New server equipment',
//       status: 'overdue',
//       type: 'payable',
//       contactInfo: 'sales@techequipment.com | (555) 333-2222',
//       paymentHistory: [
//         {
//           id: 'p4',
//           date: '2025-01-25',
//           amount: 4450,
//           method: 'Wire Transfer',
//           notes: '50% deposit'
//         }
//       ]
//     },
//     {
//       id: 'p4',
//       name: 'Marketing Experts',
//       company: 'Marketing Experts',
//       amount: 4500,
//       dueDate: '2025-03-20',
//       createdDate: '2025-02-20',
//       notes: 'Q1 marketing campaign',
//       status: 'pending',
//       type: 'payable',
//       contactInfo: 'billing@marketingexperts.com | (555) 666-7777',
//       paymentHistory: []
//     }
//   ];
// };

// // Component
// const DebtManagementSystem: React.FC = () => {
//   const [debts, setDebts] = useState<DebtRecord[]>([]);
//   const [filteredDebts, setFilteredDebts] = useState<DebtRecord[]>([]);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [activeTab, setActiveTab] = useState<'receivable' | 'payable'>('receivable');
//   const [sortField, setSortField] = useState<SortField>('dueDate');
//   const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
//   const [filterOptions, setFilterOptions] = useState<FilterOptions>({
//     status: 'all',
//     searchQuery: '',
//     dateRange: 'all'
//   });
  
//   // Modal states
//   const [modalVisible, setModalVisible] = useState<boolean>(false);
//   const [detailModalVisible, setDetailModalVisible] = useState<boolean>(false);
//   const [paymentModalVisible, setPaymentModalVisible] = useState<boolean>(false);
//   const [currentDebt, setCurrentDebt] = useState<DebtRecord | null>(null);
//   const [newDebt, setNewDebt] = useState<Partial<DebtRecord>>({
//     name: '',
//     company: '',
//     amount: 0,
//     dueDate: format(new Date(), 'yyyy-MM-dd'),
//     notes: '',
//     contactInfo: '',
//     type: 'receivable'
//   });
//   const [newPayment, setNewPayment] = useState({
//     amount: '',
//     method: 'Bank Transfer',
//     notes: ''
//   });
  
//   // Load data
//   useEffect(() => {
//     const loadData = async () => {
//       setLoading(true);
//       // In a real app, this would be an API call
//       setTimeout(() => {
//         const data = generateSampleData();
//         setDebts(data);
//         applyFilters(data, activeTab, filterOptions);
//         setLoading(false);
//       }, 1000);
//     };
    
//     loadData();
//   }, []);
  
//   // Apply filters and sorting
//   useEffect(() => {
//     applyFilters(debts, activeTab, filterOptions);
//   }, [activeTab, sortField, sortOrder, filterOptions, debts]);
  
//   const applyFilters = (data: DebtRecord[], type: 'receivable' | 'payable', filters: FilterOptions) => {
//     let filtered = data.filter(debt => debt.type === type);
    
//     // Apply status filter
//     if (filters.status !== 'all') {
//       filtered = filtered.filter(debt => debt.status === filters.status);
//     }
    
//     // Apply search filter
//     if (filters.searchQuery) {
//       const query = filters.searchQuery.toLowerCase();
//       filtered = filtered.filter(debt => 
//         debt.name.toLowerCase().includes(query) || 
//         debt.company.toLowerCase().includes(query) ||
//         debt.notes.toLowerCase().includes(query)
//       );
//     }
    
//     // Apply date filter
//     if (filters.dateRange !== 'all') {
//       const today = new Date();
      
//       switch (filters.dateRange) {
//         case 'overdue':
//           filtered = filtered.filter(debt => isBefore(parseISO(debt.dueDate), today) && debt.status !== 'paid');
//           break;
//         case 'thisWeek':
//           const nextWeek = addDays(today, 7);
//           filtered = filtered.filter(debt => 
//             isAfter(parseISO(debt.dueDate), today) && 
//             isBefore(parseISO(debt.dueDate), nextWeek) &&
//             debt.status !== 'paid'
//           );
//           break;
//         case 'thisMonth':
//           const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
//           filtered = filtered.filter(debt => 
//             isAfter(parseISO(debt.dueDate), today) && 
//             isBefore(parseISO(debt.dueDate), nextMonth) &&
//             debt.status !== 'paid'
//           );
//           break;
//       }
//     }
    
//     // Apply sorting
//     filtered.sort((a, b) => {
//       switch (sortField) {
//         case 'name':
//           return sortOrder === 'asc' 
//             ? a.name.localeCompare(b.name) 
//             : b.name.localeCompare(a.name);
//         case 'amount':
//           return sortOrder === 'asc' 
//             ? a.amount - b.amount 
//             : b.amount - a.amount;
//         case 'dueDate':
//           return sortOrder === 'asc' 
//             ? new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime() 
//             : new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
//         default:
//           return 0;
//       }
//     });
    
//     setFilteredDebts(filtered);
//   };
  
//   // Calculate summary statistics
//   const calculateSummary = (type: 'receivable' | 'payable') => {
//     const typeDebts = debts.filter(debt => debt.type === type);
    
//     const total = typeDebts.reduce((sum, debt) => sum + debt.amount, 0);
//     const paid = typeDebts.reduce((sum, debt) => {
//       if (debt.status === 'paid') return sum + debt.amount;
//       if (debt.status === 'partial') {
//         const paidAmount = debt.paymentHistory.reduce((sum, payment) => sum + payment.amount, 0);
//         return sum + paidAmount;
//       }
//       return sum;
//     }, 0);
//     const outstanding = total - paid;
//     const overdue = typeDebts.filter(debt => 
//       debt.status === 'overdue' || 
//       (debt.status !== 'paid' && isBefore(parseISO(debt.dueDate), new Date()))
//     ).reduce((sum, debt) => sum + debt.amount, 0);
    
//     return { total, paid, outstanding, overdue };
//   };
  
//   // Action handlers
//   const handleAddDebt = () => {
//     const id = `${activeTab.charAt(0)}${debts.length + 1}`;
//     const newRecord: DebtRecord = {
//       id,
//       name: newDebt.name || '',
//       company: newDebt.company || '',
//       amount: Number(newDebt.amount) || 0,
//       dueDate: newDebt.dueDate || format(new Date(), 'yyyy-MM-dd'),
//       createdDate: format(new Date(), 'yyyy-MM-dd'),
//       notes: newDebt.notes || '',
//       status: 'pending',
//       type: activeTab,
//       contactInfo: newDebt.contactInfo || '',
//       paymentHistory: []
//     };
    
//     setDebts([...debts, newRecord]);
//     setModalVisible(false);
//     setNewDebt({
//       name: '',
//       company: '',
//       amount: 0,
//       dueDate: format(new Date(), 'yyyy-MM-dd'),
//       notes: '',
//       contactInfo: '',
//       type: activeTab
//     });
    
//     Alert.alert(
//       'Success',
//       `New ${activeTab === 'receivable' ? 'receivable' : 'payable'} record added successfully.`
//     );
//   };
  
//   const handleRecordPayment = () => {
//     if (!currentDebt) return;
    
//     const paymentAmount = Number(newPayment.amount);
//     if (isNaN(paymentAmount) || paymentAmount <= 0) {
//       Alert.alert('Error', 'Please enter a valid payment amount');
//       return;
//     }
    
//     const payment: PaymentRecord = {
//       id: `payment-${Date.now()}`,
//       date: format(new Date(), 'yyyy-MM-dd'),
//       amount: paymentAmount,
//       method: newPayment.method,
//       notes: newPayment.notes
//     };
    
//     const updatedDebts = debts.map(debt => {
//       if (debt.id === currentDebt.id) {
//         const totalPaid = [...debt.paymentHistory, payment]
//           .reduce((sum, p) => sum + p.amount, 0);
        
//         let status: DebtRecord['status'] = 'pending';
//         if (totalPaid >= debt.amount) {
//           status = 'paid';
//         } else if (totalPaid > 0) {
//           status = 'partial';
//         } else if (isBefore(parseISO(debt.dueDate), new Date())) {
//           status = 'overdue';
//         }
        
//         return {
//           ...debt,
//           paymentHistory: [...debt.paymentHistory, payment],
//           status
//         };
//       }
//       return debt;
//     });
    
//     setDebts(updatedDebts);
//     setPaymentModalVisible(false);
//     setNewPayment({
//       amount: '',
//       method: 'Bank Transfer',
//       notes: ''
//     });
    
//     Alert.alert(
//       'Success',
//       'Payment recorded successfully.'
//     );
//   };
  
//   const handleStatusChange = (debt: DebtRecord, newStatus: DebtRecord['status']) => {
//     const updatedDebts = debts.map(item => {
//       if (item.id === debt.id) {
//         return { ...item, status: newStatus };
//       }
//       return item;
//     });
    
//     setDebts(updatedDebts);
    
//     Alert.alert(
//       'Success',
//       `Status updated to ${newStatus}.`
//     );
//   };
  
//   const handleDeleteDebt = (id: string) => {
//     Alert.alert(
//       'Confirm Delete',
//       'Are you sure you want to delete this record? This action cannot be undone.',
//       [
//         { text: 'Cancel', style: 'cancel' },
//         { 
//           text: 'Delete', 
//           style: 'destructive',
//           onPress: () => {
//             const updatedDebts = debts.filter(debt => debt.id !== id);
//             setDebts(updatedDebts);
//             setDetailModalVisible(false);
//             Alert.alert('Success', 'Record deleted successfully.');
//           }
//         }
//       ]
//     );
//   };
  
//   // UI Helpers
//   const getStatusColor = (status: DebtRecord['status']) => {
//     switch (status) {
//       case 'paid': return '#4CAF50';
//       case 'partial': return '#2196F3';
//       case 'pending': return '#FF9800';
//       case 'overdue': return '#F44336';
//       default: return '#757575';
//     }
//   };
  
//   const formatCurrency = (amount: number) => {
//     return `$${amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
//   };
  
//   const renderDebtItem = ({ item }: { item: DebtRecord }) => (
//     <TouchableOpacity 
//       style={styles.debtCard}
//       onPress={() => {
//         setCurrentDebt(item);
//         setDetailModalVisible(true);
//       }}
//     >
//       <View style={styles.debtCardHeader}>
//         <Text style={styles.debtName}>{item.name}</Text>
//         <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
//           <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
//         </View>
//       </View>
      
//       <Text style={styles.companyName}>{item.company}</Text>
      
//       <View style={styles.debtInfo}>
//         <View style={styles.infoItem}>
//           <Text style={styles.infoLabel}>Amount:</Text>
//           <Text style={styles.infoValue}>{formatCurrency(item.amount)}</Text>
//         </View>
        
//         <View style={styles.infoItem}>
//           <Text style={styles.infoLabel}>Due Date:</Text>
//           <Text style={[
//             styles.infoValue,
//             isBefore(parseISO(item.dueDate), new Date()) && item.status !== 'paid' ? styles.overdueText : null
//           ]}>
//             {format(parseISO(item.dueDate), 'MMM dd, yyyy')}
//           </Text>
//         </View>
//       </View>
      
//       {item.paymentHistory.length > 0 && (
//         <View style={styles.paymentInfo}>
//           <Text style={styles.paymentInfoText}>
//             {item.paymentHistory.length} payment(s) recorded
//           </Text>
//           <Text style={styles.paymentInfoText}>
//             {formatCurrency(item.paymentHistory.reduce((sum, p) => sum + p.amount, 0))} paid
//           </Text>
//         </View>
//       )}
//     </TouchableOpacity>
//   );
  
//   const renderEmptyList = () => (
//     <View style={styles.emptyContainer}>
//       <FontAwesome name="inbox" size={50} color="#ccc" />
//       <Text style={styles.emptyText}>No records found</Text>
//       <Text style={styles.emptySubtext}>
//         {filterOptions.searchQuery || filterOptions.status !== 'all' || filterOptions.dateRange !== 'all' 
//           ? 'Try changing your filters'
//           : `Add a new ${activeTab === 'receivable' ? 'receivable' : 'payable'} record`
//         }
//       </Text>
//     </View>
//   );
  
//   // Summary card
//   const SummaryCard = ({ type }: { type: 'receivable' | 'payable' }) => {
//     const summary = calculateSummary(type);
    
//     return (
//       <View style={styles.summaryCard}>
//         <Text style={styles.summaryTitle}>
//           {type === 'receivable' ? 'Accounts Receivable' : 'Accounts Payable'} Summary
//         </Text>
        
//         <View style={styles.summaryItems}>
//           <View style={styles.summaryItem}>
//             <Text style={styles.summaryLabel}>Total</Text>
//             <Text style={styles.summaryValue}>{formatCurrency(summary.total)}</Text>
//           </View>
          
//           <View style={styles.summaryItem}>
//             <Text style={styles.summaryLabel}>Paid</Text>
//             <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>
//               {formatCurrency(summary.paid)}
//             </Text>
//           </View>
          
//           <View style={styles.summaryItem}>
//             <Text style={styles.summaryLabel}>Outstanding</Text>
//             <Text style={styles.summaryValue}>{formatCurrency(summary.outstanding)}</Text>
//           </View>
          
//           <View style={styles.summaryItem}>
//             <Text style={styles.summaryLabel}>Overdue</Text>
//             <Text style={[styles.summaryValue, { color: '#F44336' }]}>
//               {formatCurrency(summary.overdue)}
//             </Text>
//           </View>
//         </View>
//       </View>
//     );
//   };
  
//   // Main render
//   if (loading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#3498db" />
//         <Text style={styles.loadingText}>Loading debt records...</Text>
//       </View>
//     );
//   }
  
//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
//       {/* Header */}
//       <View style={styles.header}>
//         <Text style={styles.headerTitle}>Debt Management</Text>
//         <TouchableOpacity 
//           style={styles.addButton}
//           onPress={() => {
//             setNewDebt({ ...newDebt, type: activeTab });
//             setModalVisible(true);
//           }}
//         >
//           <FontAwesome name="plus" size={16} color="#fff" />
//           <Text style={styles.addButtonText}>Add New</Text>
//         </TouchableOpacity>
//       </View>
      
//       {/* Tab Navigation */}
//       <View style={styles.tabContainer}>
//         <TouchableOpacity 
//           style={[styles.tab, activeTab === 'receivable' && styles.activeTab]}
//           onPress={() => setActiveTab('receivable')}
//         >
//           <FontAwesome 
//             name="arrow-circle-down" 
//             size={18} 
//             color={activeTab === 'receivable' ? "#3498db" : "#777"} 
//           />
//           <Text style={[styles.tabText, activeTab === 'receivable' && styles.activeTabText]}>
//             Money Owed TO Us
//           </Text>
//         </TouchableOpacity>
        
//         <TouchableOpacity 
//           style={[styles.tab, activeTab === 'payable' && styles.activeTab]}
//           onPress={() => setActiveTab('payable')}
//         >
//           <FontAwesome 
//             name="arrow-circle-up" 
//             size={18} 
//             color={activeTab === 'payable' ? "#3498db" : "#777"} 
//           />
//           <Text style={[styles.tabText, activeTab === 'payable' && styles.activeTabText]}>
//             Money We Owe
//           </Text>
//         </TouchableOpacity>
//       </View>
      
//       {/* Summary */}
//       <SummaryCard type={activeTab} />
      
//       {/* Filters */}
//       <View style={styles.filtersContainer}>
//         <View style={styles.searchContainer}>
//           <FontAwesome name="search" size={16} color="#999" style={styles.searchIcon} />
//           <TextInput
//             style={styles.searchInput}
//             placeholder="Search by name, company or notes..."
//             value={filterOptions.searchQuery}
//             onChangeText={(text) => setFilterOptions({ ...filterOptions, searchQuery: text })}
//           />
//           {filterOptions.searchQuery ? (
//             <TouchableOpacity
//               onPress={() => setFilterOptions({ ...filterOptions, searchQuery: '' })}
//               style={styles.clearSearch}
//             >
//               <FontAwesome name="times-circle" size={16} color="#999" />
//             </TouchableOpacity>
//           ) : null}
//         </View>
        
//         <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersRow}>
//           {/* Status Filter */}
//           <View style={styles.filterGroup}>
//             <Text style={styles.filterLabel}>Status:</Text>
//             <View style={styles.filterOptions}>
//               {['all', 'pending', 'partial', 'paid', 'overdue'].map((status) => (
//                 <TouchableOpacity
//                   key={status}
//                   style={[
//                     styles.filterOption,
//                     filterOptions.status === status && styles.filterOptionActive
//                   ]}
//                   onPress={() => setFilterOptions({ ...filterOptions, status })}
//                 >
//                   <Text style={[
//                     styles.filterOptionText,
//                     filterOptions.status === status && styles.filterOptionTextActive
//                   ]}>
//                     {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
//                   </Text>
//                 </TouchableOpacity>
//               ))}
//             </View>
//           </View>
          
//           {/* Date Filter */}
//           <View style={styles.filterGroup}>
//             <Text style={styles.filterLabel}>Due Date:</Text>
//             <View style={styles.filterOptions}>
//               {[
//                 { id: 'all', label: 'All' },
//                 { id: 'overdue', label: 'Overdue' },
//                 { id: 'thisWeek', label: 'This Week' },
//                 { id: 'thisMonth', label: 'This Month' }
//               ].map((option) => (
//                 <TouchableOpacity
//                   key={option.id}
//                   style={[
//                     styles.filterOption,
//                     filterOptions.dateRange === option.id && styles.filterOptionActive
//                   ]}
//                   onPress={() => setFilterOptions({ ...filterOptions, dateRange: option.id })}
//                 >
//                   <Text style={[
//                     styles.filterOptionText,
//                     filterOptions.dateRange === option.id && styles.filterOptionTextActive
//                   ]}>
//                     {option.label}
//                   </Text>
//                 </TouchableOpacity>
//               ))}
//             </View>
//           </View>
          
//           {/* Sort Order */}
//           <View style={styles.filterGroup}>
//             <Text style={styles.filterLabel}>Sort By:</Text>
//             <View style={styles.filterOptions}>
//               {[
//                 { id: 'dueDate' as SortField, label: 'Due Date' },
//                 { id: 'amount' as SortField, label: 'Amount' },
//                 { id: 'name' as SortField, label: 'Name' }
//               ].map((option) => (
//                 <TouchableOpacity
//                   key={option.id}
//                   style={[
//                     styles.filterOption,
//                     sortField === option.id && styles.filterOptionActive
//                   ]}
//                   onPress={() => {
//                     if (sortField === option.id) {
//                       // Toggle sort order if same field
//                       setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
//                     } else {
//                       setSortField(option.id);
//                       setSortOrder('asc');
//                     }
//                   }}
//                 >
//                   <Text style={[
//                     styles.filterOptionText,
//                     sortField === option.id && styles.filterOptionTextActive
//                   ]}>
//                     {option.label} {sortField === option.id && (
//                       <FontAwesome name={sortOrder === 'asc' ? 'sort-up' : 'sort-down'} size={14} />
//                     )}
//                   </Text>
//                 </TouchableOpacity>
//               ))}
//             </View>
//           </View>
//         </ScrollView>
//       </View>
      
//       {/* Debt List */}
//       <FlatList
//         data={filteredDebts}
//         renderItem={renderDebtItem}
//         keyExtractor={item => item.id}
//         contentContainerStyle={styles.list}
//         ListEmptyComponent={renderEmptyList}
//       />
      
//       {/* Add New Debt Modal */}
//       <Modal
//         visible={modalVisible}
//         animationType="slide"
//         transparent={true}
//         onRequestClose={() => setModalVisible(false)}
//       >
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalContainer}>
//             <View style={styles.modalHeader}>
//               <Text style={styles.modalTitle}>
//                 Add New {activeTab === 'receivable' ? 'Receivable' : 'Payable'}
//               </Text>
//               <TouchableOpacity onPress={() => setModalVisible(false)}>
//                 <FontAwesome name="times" size={20} color="#333" />
//               </TouchableOpacity>
//             </View>
            
//             <ScrollView style={styles.modalBody}>
//               <View style={styles.formGroup}>
//                 <Text style={styles.formLabel}>Name</Text>
//                 <TextInput
//                   style={styles.formInput}
//                   placeholder="Enter name"
//                   value={newDebt.name}
//                   onChangeText={(text) => setNewDebt({ ...newDebt, name: text })}
//                 />
//               </View>
              
//               <View style={styles.formGroup}>
//                 <Text style={styles.formLabel}>Company</Text>
//                 <TextInput
//                   style={styles.formInput}
//                   placeholder="Enter company name"
//                   value={newDebt.company}
//                   onChangeText={(text) => setNewDebt({ ...newDebt, company: text })}
//                 />
//               </View>
              
//               <View style={styles.formGroup}>
//                 <Text style={styles.formLabel}>Amount</Text>
//                 <TextInput
//                   style={styles.formInput}
//                   placeholder="Enter amount"
//                   keyboardType="numeric"
//                   value={newDebt.amount?.toString() || ''}
//                   onChangeText={(text) => setNewDebt({ ...newDebt, amount: parseFloat(text) || 0 })}
//                 />
//               </View>
              
//               <View style={styles.formGroup}>
//                 <Text style={styles.formLabel}>Due Date</Text>
//                 <TextInput
//                   style={styles.formInput}
//                   placeholder="YYYY-MM-DD"
//                   value={newDebt.dueDate}
//                   onChangeText={(text) => setNewDebt({ ...newDebt, dueDate: text })}
//                 />
//               </View>
              
//               <View style={styles.formGroup}>
//                 <Text style={styles.formLabel}>Contact Information</Text>
//                 <TextInput
//                   style={styles.formInput}
//                   placeholder="Email, phone number, etc."
//                   value={newDebt.contactInfo}
//                   onChangeText={(text) => setNewDebt({