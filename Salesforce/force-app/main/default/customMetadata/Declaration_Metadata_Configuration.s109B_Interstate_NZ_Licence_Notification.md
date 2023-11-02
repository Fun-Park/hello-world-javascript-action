<?xml version="1.0" encoding="UTF-8"?>
<CustomMetadata xmlns="http://soap.sforce.com/2006/04/metadata" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
    <label>s109B - Interstate/NZ Notifications</label>
    <protected>false</protected>
    <values>
        <field>Application_ID__c</field>
        <value xsi:nil="true"/>
    </values>
    <values>
        <field>BX__c</field>
        <value xsi:nil="true"/>
    </values>
    <values>
        <field>Batch_Name__c</field>
        <value xsi:nil="true"/>
    </values>
    <values>
        <field>Case_ID__c</field>
        <value xsi:type="xsd:string">$Form_Data__c.Reference_Number__c</value>
    </values>
    <values>
        <field>Comments__c</field>
        <value xsi:nil="true"/>
    </values>
    <values>
        <field>Complainant_ID__c</field>
        <value xsi:nil="true"/>
    </values>
    <values>
        <field>Date_In__c</field>
        <value xsi:type="xsd:string">$Form_Data__c.CreatedDate</value>
    </values>
    <values>
        <field>Document_Type__c</field>
        <value xsi:type="xsd:string">Online Form</value>
    </values>
    <values>
        <field>FileNo__c</field>
        <value xsi:type="xsd:string">$Form_Data__c.Participant__r.Customer_Number__c</value>
    </values>
    <values>
        <field>Folder__c</field>
        <value xsi:type="xsd:string">$Form_Data__c.Participant__r.Customer_Number__c</value>
    </values>
    <values>
        <field>GroupType__c</field>
        <value xsi:nil="true"/>
    </values>
    <values>
        <field>Licence_ID__c</field>
        <value xsi:type="xsd:string">$Form_Data__c.Participant__r.QBCC_Licence_Number__c</value>
    </values>
    <values>
        <field>Mail_From__c</field>
        <value xsi:nil="true"/>
    </values>
    <values>
        <field>Mail_To__c</field>
        <value xsi:nil="true"/>
    </values>
    <values>
        <field>Markout_Code__c</field>
        <value xsi:nil="true"/>
    </values>
    <values>
        <field>MeridioDocumentCategory__c</field>
        <value xsi:type="xsd:string">116</value>
    </values>
    <values>
        <field>MoreDetailedName__c</field>
        <value xsi:type="xsd:string">INZLF</value>
    </values>
    <values>
        <field>NamingConvention__c</field>
        <value xsi:type="xsd:string">Rule 8</value>
    </values>
    <values>
        <field>Originating_Author__c</field>
        <value xsi:type="xsd:string">$Form_Data__c.Current_User__r.Name</value>
    </values>
    <values>
        <field>ParentCase__c</field>
        <value xsi:nil="true"/>
    </values>
    <values>
        <field>Related_Customer_Field__c</field>
        <value xsi:type="xsd:string">Participant__r</value>
    </values>
    <values>
        <field>Respondent_Id__c</field>
        <value xsi:nil="true"/>
    </values>
    <values>
        <field>SFN__c</field>
        <value xsi:nil="true"/>
    </values>
    <values>
        <field>ServiceType__c</field>
        <value xsi:type="xsd:string">s109B</value>
    </values>
    <values>
        <field>Subject__c</field>
        <value xsi:type="xsd:string">Interstate or New Zealand Licence Notification</value>
    </values>
    <values>
        <field>Workflow__c</field>
        <value xsi:nil="true"/>
    </values>
</CustomMetadata>
