/**
 * Query Diagnostics Component
 *
 * Use this to identify which query is causing "data cannot be undefined" errors
 * Add this component to any screen that's having issues
 */

import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

export const QueryDiagnostics: React.FC = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Log all queries and their states
    const queries = queryClient.getQueryCache().getAll();

    console.log('📊 QUERY DIAGNOSTICS - Total Queries:', queries.length);
    console.log('='.repeat(50));

    queries.forEach((query, index) => {
      const state = query.state;
      const queryKey = JSON.stringify(query.queryKey);

      console.log(`\n[${index + 1}] Query:`, queryKey);
      console.log(`   Status: ${state.status}`);
      console.log(`   Data Type: ${state.data === undefined ? 'UNDEFINED ❌' : state.data === null ? 'NULL' : Array.isArray(state.data) ? `Array[${state.data.length}]` : typeof state.data}`);
      console.log(`   Error: ${state.error ? 'YES ❌' : 'No'}`);
      console.log(`   Fetching: ${state.isFetching ? 'YES' : 'No'}`);

      if (state.data === undefined) {
        console.error(`   ⚠️  FOUND UNDEFINED DATA IN QUERY: ${queryKey}`);
      }
    });

    console.log('\n' + '='.repeat(50));

    // Check for queries with undefined data
    const undefinedQueries = queries.filter(q => q.state.data === undefined);
    if (undefinedQueries.length > 0) {
      console.error(`\n🚨 ${undefinedQueries.length} QUERIES HAVE UNDEFINED DATA:`);
      undefinedQueries.forEach(q => {
        console.error(`   - ${JSON.stringify(q.queryKey)}`);
      });
    } else {
      console.log('\n✅ All queries have defined data!');
    }
  }, [queryClient]);

  // Render diagnostic info
  const queries = queryClient.getQueryCache().getAll();
  const undefinedQueries = queries.filter(q => q.state.data === undefined);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Query Diagnostics</Text>
      <Text style={styles.subtitle}>Total Queries: {queries.length}</Text>

      {undefinedQueries.length > 0 && (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>
            ⚠️  {undefinedQueries.length} Queries with Undefined Data:
          </Text>
          <ScrollView style={styles.errorList}>
            {undefinedQueries.map((q, i) => (
              <Text key={i} style={styles.errorItem}>
                • {JSON.stringify(q.queryKey)}
              </Text>
            ))}
          </ScrollView>
        </View>
      )}

      {undefinedQueries.length === 0 && (
        <View style={styles.successBox}>
          <Text style={styles.successText}>✅ All queries OK!</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    margin: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  errorBox: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#c62828',
    marginBottom: 8,
  },
  errorList: {
    maxHeight: 200,
  },
  errorItem: {
    fontSize: 12,
    color: '#d32f2f',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  successBox: {
    backgroundColor: '#e8f5e9',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  successText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
});
