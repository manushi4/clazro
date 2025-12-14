/**
 * Supabase Connection Test Utility
 *
 * Use this to verify Supabase connection and table existence
 * Run this in the app to diagnose connection issues
 */

import { supabase } from '../config/supabaseClient';

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  details?: any;
}

/**
 * Test basic Supabase connection
 */
export async function testSupabaseConnection(): Promise<ConnectionTestResult> {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('count')
      .limit(1);

    if (error) {
      return {
        success: false,
        message: 'Supabase connection failed',
        details: error,
      };
    }

    return {
      success: true,
      message: 'Supabase connection successful',
      details: data,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Connection error',
      details: error,
    };
  }
}

/**
 * Test if required parent tables exist
 */
export async function testParentTables(): Promise<Record<string, ConnectionTestResult>> {
  const tables = [
    'students',
    'parents',
    'invoices',
    'invoice_items',
    'academic_progress',
    'class_schedules',
    'exam_schedules',
    'parent_teacher_communications',
    'parent_financial_summary',
  ];

  const results: Record<string, ConnectionTestResult> = {};

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        results[table] = {
          success: false,
          message: `Table ${table} query failed`,
          details: error,
        };
      } else {
        results[table] = {
          success: true,
          message: `Table ${table} exists and is accessible`,
          details: { rowCount: data?.length || 0 },
        };
      }
    } catch (error) {
      results[table] = {
        success: false,
        message: `Error accessing table ${table}`,
        details: error,
      };
    }
  }

  return results;
}

/**
 * Run all connection tests
 */
export async function runAllConnectionTests() {
  console.log('🔍 Testing Supabase Connection...\n');

  // Test basic connection
  const connectionResult = await testSupabaseConnection();
  console.log('📡 Connection Test:', connectionResult.success ? '✅' : '❌');
  console.log('   Message:', connectionResult.message);
  if (connectionResult.details) {
    console.log('   Details:', connectionResult.details);
  }
  console.log('');

  // Test tables
  console.log('📋 Testing Parent Tables...\n');
  const tableResults = await testParentTables();

  let successCount = 0;
  let failCount = 0;

  Object.entries(tableResults).forEach(([table, result]) => {
    if (result.success) {
      successCount++;
      console.log(`✅ ${table}: ${result.message}`);
    } else {
      failCount++;
      console.log(`❌ ${table}: ${result.message}`);
      if (result.details) {
        console.log(`   Error:`, result.details);
      }
    }
  });

  console.log('');
  console.log(`📊 Summary: ${successCount} successful, ${failCount} failed`);

  return {
    connection: connectionResult,
    tables: tableResults,
    summary: {
      total: Object.keys(tableResults).length,
      successful: successCount,
      failed: failCount,
    },
  };
}
