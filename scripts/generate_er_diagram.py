#!/usr/bin/env python3
"""
Generate Chen-style ER Diagram for Attendance Management System Database
Creates both PNG and PDF versions
"""

from graphviz import Graph

def create_er_diagram():
    # Create an undirected graph for Chen notation
    dot = Graph(comment='Attendance Management System ER Diagram', engine='neato')
    dot.attr(overlap='false', splines='true', sep='+25,25')
    dot.attr('node', fontname='Arial', fontsize='10')
    dot.attr('edge', fontname='Arial', fontsize='9')

    # ==========================================
    # ENTITIES (Rectangles)
    # ==========================================
    entity_style = {'shape': 'box', 'style': 'filled', 'fillcolor': 'white', 'penwidth': '2'}
    
    dot.node('Employee', 'Employee', **entity_style)
    dot.node('Department', 'Department', **entity_style)
    dot.node('AttendanceRecord', 'Attendance\nRecord', **entity_style)
    dot.node('AttendanceEntry', 'Attendance\nEntry', **entity_style)
    dot.node('LeaveRequest', 'Leave\nRequest', **entity_style)
    dot.node('LeaveType', 'Leave\nType', **entity_style)
    dot.node('LeaveBalance', 'Leave\nBalance', **entity_style)
    dot.node('Holiday', 'Holiday', **entity_style)

    # ==========================================
    # ATTRIBUTES (Ovals)
    # ==========================================
    attr_style = {'shape': 'ellipse', 'style': 'filled', 'fillcolor': 'white', 'fontsize': '9'}
    pk_style = {'shape': 'ellipse', 'style': 'filled', 'fillcolor': 'white', 'fontsize': '9'}  # PK will use underline in label

    # Employee attributes
    dot.node('emp_id', '<<u>id</u>>', **pk_style)
    dot.node('emp_first_name', 'first_name', **attr_style)
    dot.node('emp_last_name', 'last_name', **attr_style)
    dot.node('emp_email', '<<u>email</u>>', **pk_style)
    dot.node('emp_password', 'password_hash', **attr_style)
    dot.node('emp_phone', 'phone', **attr_style)
    dot.node('emp_designation', 'designation', **attr_style)
    dot.node('emp_role', 'role', **attr_style)
    dot.node('emp_is_active', 'is_active', **attr_style)

    dot.edge('Employee', 'emp_id')
    dot.edge('Employee', 'emp_first_name')
    dot.edge('Employee', 'emp_last_name')
    dot.edge('Employee', 'emp_email')
    dot.edge('Employee', 'emp_password')
    dot.edge('Employee', 'emp_phone')
    dot.edge('Employee', 'emp_designation')
    dot.edge('Employee', 'emp_role')
    dot.edge('Employee', 'emp_is_active')

    # Department attributes
    dot.node('dept_id', '<<u>id</u>>', **pk_style)
    dot.node('dept_name', 'name', **attr_style)

    dot.edge('Department', 'dept_id')
    dot.edge('Department', 'dept_name')

    # AttendanceRecord attributes
    dot.node('att_id', '<<u>id</u>>', **pk_style)
    dot.node('att_date', 'date', **attr_style)
    dot.node('att_check_in', 'check_in_time', **attr_style)
    dot.node('att_check_out', 'check_out_time', **attr_style)
    dot.node('att_status', 'status', **attr_style)
    dot.node('att_approval', 'approval_status', **attr_style)
    dot.node('att_confirmed', 'is_confirmed', **attr_style)

    dot.edge('AttendanceRecord', 'att_id')
    dot.edge('AttendanceRecord', 'att_date')
    dot.edge('AttendanceRecord', 'att_check_in')
    dot.edge('AttendanceRecord', 'att_check_out')
    dot.edge('AttendanceRecord', 'att_status')
    dot.edge('AttendanceRecord', 'att_approval')
    dot.edge('AttendanceRecord', 'att_confirmed')

    # AttendanceEntry attributes
    dot.node('entry_id', '<<u>id</u>>', **pk_style)
    dot.node('entry_type', 'entry_type', **attr_style)
    dot.node('entry_timestamp', 'timestamp', **attr_style)
    dot.node('entry_reason', 'reason', **attr_style)

    dot.edge('AttendanceEntry', 'entry_id')
    dot.edge('AttendanceEntry', 'entry_type')
    dot.edge('AttendanceEntry', 'entry_timestamp')
    dot.edge('AttendanceEntry', 'entry_reason')

    # LeaveRequest attributes
    dot.node('lr_id', '<<u>id</u>>', **pk_style)
    dot.node('lr_start', 'start_date', **attr_style)
    dot.node('lr_end', 'end_date', **attr_style)
    dot.node('lr_reason', 'reason', **attr_style)
    dot.node('lr_status', 'status', **attr_style)
    dot.node('lr_applied', 'applied_at', **attr_style)

    dot.edge('LeaveRequest', 'lr_id')
    dot.edge('LeaveRequest', 'lr_start')
    dot.edge('LeaveRequest', 'lr_end')
    dot.edge('LeaveRequest', 'lr_reason')
    dot.edge('LeaveRequest', 'lr_status')
    dot.edge('LeaveRequest', 'lr_applied')

    # LeaveType attributes
    dot.node('lt_id', '<<u>id</u>>', **pk_style)
    dot.node('lt_name', 'name', **attr_style)

    dot.edge('LeaveType', 'lt_id')
    dot.edge('LeaveType', 'lt_name')

    # LeaveBalance attributes
    dot.node('lb_id', '<<u>id</u>>', **pk_style)
    dot.node('lb_year', 'year', **attr_style)
    dot.node('lb_total', 'total_leaves', **attr_style)
    dot.node('lb_used', 'used_leaves', **attr_style)
    dot.node('lb_remaining', 'remaining_leaves', **attr_style)

    dot.edge('LeaveBalance', 'lb_id')
    dot.edge('LeaveBalance', 'lb_year')
    dot.edge('LeaveBalance', 'lb_total')
    dot.edge('LeaveBalance', 'lb_used')
    dot.edge('LeaveBalance', 'lb_remaining')

    # Holiday attributes
    dot.node('hol_id', '<<u>id</u>>', **pk_style)
    dot.node('hol_name', 'name', **attr_style)
    dot.node('hol_date', 'date', **attr_style)
    dot.node('hol_desc', 'description', **attr_style)

    dot.edge('Holiday', 'hol_id')
    dot.edge('Holiday', 'hol_name')
    dot.edge('Holiday', 'hol_date')
    dot.edge('Holiday', 'hol_desc')

    # ==========================================
    # RELATIONSHIPS (Diamonds)
    # ==========================================
    rel_style = {'shape': 'diamond', 'style': 'filled', 'fillcolor': 'white', 'penwidth': '2'}

    # Employee belongs_to Department
    dot.node('R_belongs_to', 'belongs to', **rel_style)
    dot.edge('Employee', 'R_belongs_to', label='n')
    dot.edge('R_belongs_to', 'Department', label='1')

    # Employee reports_to Employee (self-reference)
    dot.node('R_reports_to', 'reports to', **rel_style)
    dot.edge('Employee', 'R_reports_to', label='n')
    dot.edge('R_reports_to', 'Employee', label='1')

    # Employee has AttendanceRecord
    dot.node('R_has_attendance', 'has', **rel_style)
    dot.edge('Employee', 'R_has_attendance', label='1')
    dot.edge('R_has_attendance', 'AttendanceRecord', label='n')

    # AttendanceRecord contains AttendanceEntry
    dot.node('R_contains', 'contains', **rel_style)
    dot.edge('AttendanceRecord', 'R_contains', label='1')
    dot.edge('R_contains', 'AttendanceEntry', label='n')

    # Employee requests LeaveRequest
    dot.node('R_requests', 'requests', **rel_style)
    dot.edge('Employee', 'R_requests', label='1')
    dot.edge('R_requests', 'LeaveRequest', label='n')

    # LeaveRequest of_type LeaveType
    dot.node('R_of_type', 'of type', **rel_style)
    dot.edge('LeaveRequest', 'R_of_type', label='n')
    dot.edge('R_of_type', 'LeaveType', label='1')

    # Employee has LeaveBalance
    dot.node('R_has_balance', 'has balance', **rel_style)
    dot.edge('Employee', 'R_has_balance', label='1')
    dot.edge('R_has_balance', 'LeaveBalance', label='n')

    return dot


def main():
    print("🎨 Generating Chen-style ER Diagram for Attendance Management System...")
    
    dot = create_er_diagram()
    
    # Add title
    dot.attr(label=r'\n\nAttendance Management System\nER Diagram\n', fontsize='16', fontname='Arial Bold')
    
    output_dir = '/home/cygnet/Intern-project-test/docs'
    
    # Create output directory if it doesn't exist
    import os
    os.makedirs(output_dir, exist_ok=True)
    
    # Save as PNG
    png_path = f'{output_dir}/er_diagram'
    dot.render(png_path, format='png', cleanup=True)
    print(f"✅ PNG saved: {png_path}.png")
    
    # Save as PDF
    pdf_path = f'{output_dir}/er_diagram'
    dot.render(pdf_path, format='pdf', cleanup=True)
    print(f"✅ PDF saved: {pdf_path}.pdf")
    
    # Also save the DOT source file
    dot_path = f'{output_dir}/er_diagram.dot'
    dot.save(dot_path)
    print(f"✅ DOT source saved: {dot_path}")
    
    print("\n📁 All files saved in:", output_dir)


if __name__ == '__main__':
    main()
