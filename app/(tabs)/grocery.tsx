import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Trash2 } from 'lucide-react-native';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/store/authStore';
import { GroceryItem, GroceryList } from '@/types';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '@/constants/theme';
import { GROCERY_CATEGORIES } from '@/constants/app';

export default function GroceryScreen() {
  const { user } = useAuthStore();
  const [list, setList] = useState<GroceryList | null>(null);
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchGroceryList();
  }, []);

  const fetchGroceryList = async () => {
    if (!user) return;

    const { data: lists } = await supabase
      .from('grocery_lists')
      .select('*')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    if (lists) {
      setList(lists);
      fetchItems(lists.id);
    }
  };

  const fetchItems = async (listId: string) => {
    const { data } = await supabase
      .from('grocery_items')
      .select('*')
      .eq('list_id', listId)
      .order('added_at', { ascending: false });

    if (data) {
      setItems(data);
    }
  };

  const addItem = async () => {
    if (!newItemName.trim() || !list) return;

    setLoading(true);
    const { error } = await supabase
      .from('grocery_items')
      .insert({
        list_id: list.id,
        name: newItemName.trim(),
        is_checked: false,
      });

    if (!error) {
      setNewItemName('');
      await fetchItems(list.id);
    }
    setLoading(false);
  };

  const toggleItem = async (item: GroceryItem) => {
    await supabase
      .from('grocery_items')
      .update({ is_checked: !item.is_checked })
      .eq('id', item.id);

    await fetchItems(list!.id);
  };

  const deleteItem = async (itemId: string) => {
    await supabase
      .from('grocery_items')
      .delete()
      .eq('id', itemId);

    await fetchItems(list!.id);
  };

  const groupedItems = GROCERY_CATEGORIES.map(category => ({
    category,
    items: items.filter(item => item.category === category || (!item.category && category === 'Other')),
  })).filter(group => group.items.length > 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.addSection}>
        <Input
          placeholder="Add item..."
          value={newItemName}
          onChangeText={setNewItemName}
          onSubmitEditing={addItem}
          returnKeyType="done"
          style={styles.input}
        />
        <Button
          title="Add"
          onPress={addItem}
          loading={loading}
          icon={<Plus size={20} color={COLORS.background} />}
          size="medium"
        />
      </View>

      <FlatList
        data={groupedItems}
        keyExtractor={(item) => item.category}
        renderItem={({ item: group }) => (
          <View style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{group.category}</Text>
            {group.items.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => toggleItem(item)}
                >
                  {item.is_checked && <View style={styles.checkboxChecked} />}
                </TouchableOpacity>
                
                <Text
                  style={[
                    styles.itemText,
                    item.is_checked && styles.itemTextChecked,
                  ]}
                >
                  {item.name}
                  {item.quantity && ` (${item.quantity}${item.unit || ''})`}
                </Text>

                <TouchableOpacity
                  onPress={() => deleteItem(item.id)}
                  style={styles.deleteButton}
                >
                  <Trash2 size={18} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🛒</Text>
            <Text style={styles.emptyText}>Your grocery list is empty</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  addSection: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
    alignItems: 'flex-start',
  },
  input: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  categorySection: {
    marginBottom: SPACING.lg,
  },
  categoryTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 18,
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    gap: SPACING.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: RADIUS.xs,
    borderWidth: 2,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    width: 14,
    height: 14,
    borderRadius: RADIUS.xs / 2,
    backgroundColor: COLORS.primary,
  },
  itemText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    flex: 1,
  },
  itemTextChecked: {
    textDecorationLine: 'line-through',
    color: COLORS.textSecondary,
  },
  deleteButton: {
    padding: SPACING.xs,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
});
