from app.database import SessionLocal, engine, Base
from app.auth import hash_password
from app import models

Base.metadata.create_all(bind=engine)
db = SessionLocal()

# create default department
dept = db.query(models.Department).filter_by(name="General").first()
if not dept:
    dept = models.Department(name="General")
    db.add(dept)
    db.commit()
    db.refresh(dept)

# create admin user
admin_email = "admin@company.com"
admin = db.query(models.Employee).filter_by(email=admin_email).first()
if not admin:
    admin = models.Employee(
        first_name="Admin",
        last_name="User",
        email=admin_email,
        password_hash=hash_password("admin123"),
        role=models.RoleEnum.admin,
        department_id=dept.id
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    print("Created admin:", admin.email)
else:
    print("Admin already exists")

# create manager user
manager_email = "manager@company.com"
manager = db.query(models.Employee).filter_by(email=manager_email).first()
if not manager:
    manager = models.Employee(
        first_name="Test",
        last_name="Manager",
        email=manager_email,
        password_hash=hash_password("test123"),
        role=models.RoleEnum.manager,
        department_id=dept.id
    )
    db.add(manager)
    db.commit()
    db.refresh(manager)
    print("Created manager:", manager.email)
else:
    print("Manager already exists")

# create employee user (reporting to manager)
employee_email = "employee@company.com"
employee = db.query(models.Employee).filter_by(email=employee_email).first()
if not employee:
    employee = models.Employee(
        first_name="Test",
        last_name="Employee",
        email=employee_email,
        password_hash=hash_password("test123"),
        role=models.RoleEnum.employee,
        department_id=dept.id,
        manager_id=manager.id  # Employee reports to manager
    )
    db.add(employee)
    db.commit()
    db.refresh(employee)
    print("Created employee:", employee.email, "reporting to manager ID:", manager.id)
else:
    # Update existing employee to report to manager if not already
    if employee.manager_id != manager.id:
        employee.manager_id = manager.id
        db.commit()
        print("Updated employee to report to manager")
    else:
        print("Employee already exists and reports to manager")

# seed leave types
leave_type = db.query(models.LeaveType).filter_by(name="Leave").first()
if not leave_type:
    leave_type = models.LeaveType(name="Leave")
    db.add(leave_type)
    db.commit()
    print("Created leave type: Leave")

types = ["Sick", "Casual", "Paid", "Unpaid", "Medical"]
for t in types:
    if not db.query(models.LeaveType).filter_by(name=t).first():
        db.add(models.LeaveType(name=t))
db.commit()
print("Seeded leave types")
db.close()
