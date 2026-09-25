package com.projetointer.backend.catalog;
import com.projetointer.backend.user.User;
import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity @Table(name="class_offerings")
public class ClassOffering {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @Column(nullable=false,unique=true) private String slug;
 @Column(nullable=false) private String name;
 @Column(nullable=false) private String modality;
 @Column(nullable=false) private String days;
 @Column(nullable=false) private String timeRange;
 @Column(nullable=false) private String instructor;
 @Column(nullable=false) private BigDecimal price;
 private int capacity=30; private boolean active=true; private boolean available=true; private String note;
 @ManyToOne private User teacher;
 protected ClassOffering(){}
 public ClassOffering(String slug,String name,String modality,String days,String timeRange,String instructor,BigDecimal price,User teacher,boolean available,String note){this.slug=slug;this.name=name;this.modality=modality;this.days=days;this.timeRange=timeRange;this.instructor=instructor;this.price=price;this.teacher=teacher;this.available=available;this.note=note;}
 public Long getId(){return id;} public String getSlug(){return slug;} public String getName(){return name;} public String getModality(){return modality;} public String getDays(){return days;} public String getTimeRange(){return timeRange;} public String getInstructor(){return instructor;} public BigDecimal getPrice(){return price;} public int getCapacity(){return capacity;} public boolean isActive(){return active;} public boolean isAvailable(){return available;} public String getNote(){return note;} public User getTeacher(){return teacher;}
}
